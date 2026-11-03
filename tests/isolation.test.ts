import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

process.loadEnvFile(".env.local");

// Runs against the real database as the restricted app role, because that's what enforces isolation.
const { sql, withTenant, withUser } = await import("@/lib/db");

const run = Date.now();
let orgA: string, orgB: string, jobB: string, appB: string, userB: string;

beforeAll(async () => {
  const insertOrg = (slug: string) => sql<{ id: string }[]>`insert into organizations (slug, name) values (${slug}, ${slug}) returning id`;
  [{ id: orgA }] = await insertOrg(`iso-a-${run}`);
  [{ id: orgB }] = await insertOrg(`iso-b-${run}`);
  [{ id: userB }] = await sql<{ id: string }[]>`insert into users (email, name, password_hash) values (${`iso-${run}@example.com`}, 'B', 'x') returning id`;
  await withTenant(orgB, async (tx) => {
    await tx`insert into org_settings (org_id, hr_email) values (${orgB}, 'hr@b.example.com')`;
    await tx`insert into memberships (org_id, user_id) values (${orgB}, ${userB})`;
    [{ id: jobB }] = await tx<{ id: string }[]>`
      insert into jobs (org_id, title, description, threshold, active_days, status, closes_at)
      values (${orgB}, 'Secret role', 'd', 70, 7, 'published', now() + interval '7 days') returning id`;
    [{ id: appB }] = await tx<{ id: string }[]>`
      insert into applications (org_id, job_id, name, email, consent_at) values (${orgB}, ${jobB}, 'Cand', 'c@example.com', now()) returning id`;
    await tx`insert into resumes (application_id, org_id, filename, content_type, data) values (${appB}, ${orgB}, 'r.pdf', 'application/pdf', ${new Uint8Array([1])})`;
    await tx`insert into emails (org_id, kind, to_addrs, subject, html, status) values (${orgB}, 'x', ${["a@example.com"]}, 's', 'h', 'captured')`;
  });
});

afterAll(async () => {
  // The app role has no delete policy on organizations, so cleanup uses the owner connection.
  const admin = new URL(process.env.ADMIN_DATABASE_URL!);
  admin.pathname = new URL(process.env.DATABASE_URL!).pathname;
  const owner = postgres(admin.toString(), { max: 1 });
  await owner`delete from organizations where id in (${orgA}, ${orgB})`;
  await owner`delete from users where id = ${userB}`;
  await owner.end();
  await sql.end();
});

const TENANT_TABLES = ["org_settings", "memberships", "jobs", "job_rounds", "applications", "resumes", "application_events", "emails"];

describe("tenant isolation", () => {
  it("connects as a role that can't bypass row-level security", async () => {
    const [role] = await sql<{ rolsuper: boolean; rolbypassrls: boolean }[]>`
      select rolsuper, rolbypassrls from pg_roles where rolname = current_user`;
    expect(role).toEqual({ rolsuper: false, rolbypassrls: false });
  });

  it("returns nothing on every tenant table when no tenant is set", async () => {
    for (const table of TENANT_TABLES) {
      const rows = await sql.unsafe(`select 1 from ${table} limit 1`);
      expect(rows.length, table).toBe(0);
    }
  });

  it("hides another tenant's rows even when queried by id", async () => {
    await withTenant(orgA, async (tx) => {
      expect(await tx`select 1 from jobs where id = ${jobB}`).toHaveLength(0);
      expect(await tx`select 1 from applications where id = ${appB}`).toHaveLength(0);
      expect(await tx`select 1 from resumes where application_id = ${appB}`).toHaveLength(0);
      expect(await tx`select 1 from emails`).toHaveLength(0);
      expect(await tx`select 1 from org_settings where org_id = ${orgB}`).toHaveLength(0);
    });
  });

  it("can't update or delete another tenant's rows", async () => {
    await withTenant(orgA, async (tx) => {
      expect((await tx`update jobs set title = 'hacked' where id = ${jobB}`).count).toBe(0);
      expect((await tx`delete from applications where id = ${appB}`).count).toBe(0);
      expect((await tx`update organizations set name = 'hacked' where id = ${orgB}`).count).toBe(0);
    });
    const [job] = await withTenant(orgB, (tx) => tx<{ title: string }[]>`select title from jobs where id = ${jobB}`);
    expect(job.title).toBe("Secret role");
  });

  it("rejects writing a row into another tenant", async () => {
    await expect(
      withTenant(orgA, (tx) => tx`insert into jobs (org_id, title, description, threshold, active_days) values (${orgB}, 't', 'd', 70, 7)`),
    ).rejects.toThrow(/row-level security/);
  });

  it("rejects a row that references another tenant's job", async () => {
    await expect(
      withTenant(orgA, (tx) => tx`insert into applications (org_id, job_id, name, email, consent_at) values (${orgA}, ${jobB}, 'x', 'x@example.com', now())`),
    ).rejects.toThrow(/foreign key/);
  });

  it("doesn't leak tenant context across pooled connections", async () => {
    await withTenant(orgB, (tx) => tx`select 1`);
    const leftovers = await Promise.all(Array.from({ length: 12 }, () => sql`select 1 from jobs`));
    expect(leftovers.every((rows) => rows.length === 0)).toBe(true);
  });

  it("shows a user only their own memberships before a tenant is chosen", async () => {
    const mine = await withUser(userB, (tx) => tx`select org_id from memberships`);
    expect(mine).toHaveLength(1);
    const other = await withUser("00000000-0000-0000-0000-000000000000", (tx) => tx`select org_id from memberships`);
    expect(other).toHaveLength(0);
  });
});
