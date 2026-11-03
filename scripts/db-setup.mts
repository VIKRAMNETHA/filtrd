import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

// Creates the database and the restricted app role, then applies migrations as the owner.
const adminUrl = process.env.ADMIN_DATABASE_URL;
const appUrl = process.env.DATABASE_URL;
if (!adminUrl || !appUrl) throw new Error("ADMIN_DATABASE_URL and DATABASE_URL are required");

const app = new URL(appUrl);
const dbName = app.pathname.slice(1);
const role = decodeURIComponent(app.username);
const password = decodeURIComponent(app.password);

const server = postgres(adminUrl, { max: 1, onnotice: () => {} });
const [hasDb] = await server`select 1 from pg_database where datname = ${dbName}`;
if (!hasDb) await server.unsafe(`create database "${dbName}"`);
const [hasRole] = await server`select 1 from pg_roles where rolname = ${role}`;
const literal = password.replaceAll("'", "''");
await server.unsafe(
  hasRole
    ? `alter role "${role}" login password '${literal}' nosuperuser nobypassrls`
    : `create role "${role}" login password '${literal}' nosuperuser nobypassrls`,
);
await server.end();

const adminDb = new URL(adminUrl);
adminDb.pathname = `/${dbName}`;
const db = postgres(adminDb.toString(), { max: 1, onnotice: () => {} });
await db`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`;

const dir = join(process.cwd(), "db/migrations");
for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
  const [done] = await db`select 1 from schema_migrations where name = ${file}`;
  if (done) continue;
  await db.begin(async (tx) => {
    await tx.unsafe(readFileSync(join(dir, file), "utf8"));
    await tx`insert into schema_migrations (name) values (${file})`;
  });
  console.log(`applied ${file}`);
}

await db.unsafe(`
  grant usage on schema public to "${role}";
  grant select, insert, update, delete on all tables in schema public to "${role}";
  revoke all on schema_migrations from "${role}";
  grant execute on all functions in schema public to "${role}";
`);
await db.end();
console.log(`database "${dbName}" ready; app connects as "${role}"`);
