"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { endSession, hashPassword, startSession, verifyPassword } from "@/lib/auth";
import { sql, withUser } from "@/lib/db";
import { allowRequest } from "@/lib/rate-limit";
import type { FormState } from "@/lib/types";

const Signup = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(120),
  email: z.email("Please enter a valid work email.").max(200),
  password: z.string().min(10, "Use at least 10 characters for your password.").max(200),
});

async function clientIp() {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

export async function signupAction(_: FormState, form: FormData): Promise<FormState> {
  if (!allowRequest(`signup:${await clientIp()}`, 10, 60 * 60_000)) {
    return { error: "Too many attempts. Please try again later." };
  }
  const parsed = Signup.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, password } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  const [existing] = await sql`select 1 from users where lower(email) = ${email}`;
  if (existing) return { error: "An account with this email already exists. Try signing in." };

  const passwordHash = await hashPassword(password);
  const [user] = await sql<{ id: string }[]>`
    insert into users (email, name, password_hash) values (${email}, ${name}, ${passwordHash}) returning id`;
  await startSession(user.id, null);
  redirect("/onboarding");
}

export async function loginAction(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!allowRequest(`login:${await clientIp()}:${email}`, 10, 15 * 60_000)) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const [user] = await sql<{ id: string; passwordHash: string }[]>`
    select id, password_hash from users where lower(email) = ${email}`;
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "That email and password don't match." };
  }

  const membership = await withUser(user.id, async (tx) => {
    const [m] = await tx<{ orgId: string }[]>`select org_id from memberships where user_id = ${user.id} limit 1`;
    return m ?? null;
  });
  await startSession(user.id, membership?.orgId ?? null);
  redirect(membership ? "/dashboard" : "/onboarding");
}

export async function logoutAction() {
  await endSession();
  redirect("/login");
}
