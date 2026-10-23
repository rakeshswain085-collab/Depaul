import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL is required. Add it to backend/.env (the file is currently empty) and restart the backend.",
  );
}

export const db = new Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});
