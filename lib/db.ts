import postgres from "postgres";

type Client = postgres.Sql<Record<string, never>>;

const globalForDb = globalThis as unknown as { hireflowSql?: Client };

function createClient(): Client {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return postgres(url, { max: 10, transform: postgres.camel }) as unknown as Client;
}

// Reused across hot reloads so development doesn't leak connections.
export const sql: Client = globalForDb.hireflowSql ?? createClient();
if (process.env.NODE_ENV !== "production") globalForDb.hireflowSql = sql;

export type Tx = postgres.TransactionSql<Record<string, never>>;

/** Runs `fn` in a transaction scoped to one tenant. RLS hides every other tenant's rows. */
export async function withTenant<T>(orgId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return (await sql.begin(async (tx) => {
    await tx`select set_config('app.org_id', ${orgId}, true)`;
    return fn(tx as unknown as Tx);
  })) as T;
}

/** Runs `fn` with only the user identity set, for reads that precede tenant selection. */
export async function withUser<T>(userId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return (await sql.begin(async (tx) => {
    await tx`select set_config('app.user_id', ${userId}, true)`;
    return fn(tx as unknown as Tx);
  })) as T;
}
