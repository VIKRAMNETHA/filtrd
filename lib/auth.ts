import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify, SignJWT } from "jose";
import { sql, withTenant, withUser } from "./db";
import type { Org, OrgSettings } from "./types";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const COOKIE = "hf_session";
const MAX_AGE = 60 * 60 * 24 * 14;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, key] = stored.split(":");
  const actual = await scrypt(password, Buffer.from(salt, "hex"), 64);
  return timingSafeEqual(actual, Buffer.from(key, "hex"));
}

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(value);
}

export async function startSession(userId: string, orgId: string | null) {
  const token = await new SignJWT({ orgId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export const getSession = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { userId: payload.sub as string, orgId: (payload.orgId as string | null) ?? null };
  } catch {
    return null;
  }
});

export const getUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  const [user] = await sql<{ id: string; email: string; name: string }[]>`
    select id, email, name from users where id = ${session.userId}`;
  return user ?? null;
});

export type AuthContext = {
  user: { id: string; email: string; name: string };
  org: Org;
  settings: OrgSettings;
};

/** Resolves the signed-in user and their tenant, re-checking membership on every request. */
export const requireOrg = cache(async (): Promise<AuthContext> => {
  const session = await getSession();
  const user = await getUser();
  if (!session || !user) redirect("/login");

  const orgId =
    session.orgId ??
    (await withUser(user.id, async (tx) => {
      const [m] = await tx<{ orgId: string }[]>`select org_id from memberships where user_id = ${user.id} limit 1`;
      return m?.orgId ?? null;
    }));
  if (!orgId) redirect("/onboarding");

  const result = await withTenant(orgId, async (tx) => {
    const [member] = await tx`select 1 from memberships where org_id = ${orgId} and user_id = ${user.id}`;
    if (!member) return null;
    const [org] = await tx<Org[]>`select * from organizations where id = ${orgId}`;
    const [settings] = await tx<OrgSettings[]>`select * from org_settings where org_id = ${orgId}`;
    return { org, settings };
  });
  if (!result?.org || !result.settings) redirect("/onboarding");
  return { user, org: result.org, settings: result.settings };
});
