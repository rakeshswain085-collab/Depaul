import dotenv from "dotenv";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";
import pg from "pg";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const { DATABASE_URL, ADMIN_EMAIL, ADMIN_INITIAL_PASSWORD } = process.env;
const email = ADMIN_EMAIL?.trim().toLowerCase();
if (!DATABASE_URL || !email || !ADMIN_INITIAL_PASSWORD) throw new Error("Set DATABASE_URL, ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD in .env.local.");
if (ADMIN_INITIAL_PASSWORD.length < 12) throw new Error("Use an initial admin password of at least 12 characters.");
const rl = createInterface({ input, output });
const confirmation = await rl.question(`Create ${email} as the initial superadmin? Type YES: `);
try {
  if (confirmation !== "YES") process.exitCode = 0;
  else {
    const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const result = await client.query(
      "insert into admins (name, email, password_hash, role, is_active) values ($1, $2, $3, 'superadmin', true) on conflict (email) do nothing returning id",
      ["School Super Admin", email, await bcrypt.hash(ADMIN_INITIAL_PASSWORD, 12)],
    );
    await client.end();
    if (!result.rowCount) throw new Error("An account with this email already exists. No changes made.");
    console.log("Initial Supabase superadmin created successfully. Remove ADMIN_INITIAL_PASSWORD now.");
  }
} finally { rl.close(); }
