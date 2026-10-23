import "server-only";

import { Pool, type QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var supabasePostgresPool: Pool | undefined;
}

function getConnectionString() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is missing from the server environment.");

  const configuredSupabaseUrl = process.env.SUPABASE_URL;
  if (!configuredSupabaseUrl) {
    throw new Error("SUPABASE_URL is missing from the server environment.");
  }

  let connectionUrl: URL;
  let supabaseUrl: URL;
  try {
    connectionUrl = new URL(url);
    supabaseUrl = new URL(configuredSupabaseUrl);
  } catch {
    throw new Error(
      "DATABASE_URL and SUPABASE_URL must be valid URLs. Copy the PostgreSQL connection URI from your Supabase project settings.",
    );
  }

  if (
    connectionUrl.protocol !== "postgres:" &&
    connectionUrl.protocol !== "postgresql:"
  ) {
    throw new Error("DATABASE_URL must use the PostgreSQL protocol.");
  }

  const projectRef = supabaseUrl.hostname.split(".")[0];
  const directHost = `db.${projectRef}.supabase.co`;
  const isDirectConnection = connectionUrl.hostname === directHost;
  const isPoolerConnection =
    connectionUrl.hostname.endsWith(".pooler.supabase.com") &&
    connectionUrl.username === `postgres.${projectRef}`;

  if (
    (!isDirectConnection && !isPoolerConnection) ||
    (isDirectConnection && connectionUrl.username !== "postgres")
  ) {
    throw new Error(
      "DATABASE_URL does not match SUPABASE_URL. Copy the PostgreSQL URI for this same Supabase project; direct connections use user postgres, while pooler connections use postgres.<project-ref>.",
    );
  }

  if (connectionUrl.pathname !== "/postgres" || !connectionUrl.password) {
    throw new Error(
      "DATABASE_URL must include the postgres database and a password. URL-encode reserved characters in the password.",
    );
  }

  return url;
}

export const db =
  globalThis.supabasePostgresPool ??
  new Pool({
    connectionString: getConnectionString(),
    ssl: { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    keepAlive: true,
  });

if (process.env.NODE_ENV !== "production") globalThis.supabasePostgresPool = db;

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
) {
  return db.query<T>(text, values);
}
