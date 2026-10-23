import "server-only";

import { Pool, type QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var supabasePostgresPool: Pool | undefined;
}

function getConnectionString() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is missing from the server environment.");
  return url;
}

export const db =
  globalThis.supabasePostgresPool ??
  new Pool({
    connectionString: getConnectionString(),
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  });

if (process.env.NODE_ENV !== "production") globalThis.supabasePostgresPool = db;

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
) {
  return db.query<T>(text, values);
}
