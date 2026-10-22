
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const uri = process.env.MONGODB_URI;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_INITIAL_PASSWORD;
const name = "School Super Admin";

if (!uri || !email || !password) {
  console.error(
    "Set MONGODB_URI, ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD in .env.local",
  );
  process.exit(1);
}

if (password.length < 12) {
  console.error("Use an initial admin password of at least 12 characters.");
  process.exit(1);
}

const rl = createInterface({ input, output });

try {
  const confirmation = await rl.question(
    `Create or promote ${email} as the initial superadmin? Type YES: `,
  );

  if (confirmation !== "YES") {
    console.log("Cancelled.");
    process.exitCode = 0;
  } else {
    await mongoose.connect(uri);

    const admins = mongoose.connection.collection("admins");
    const existing = await admins.findOne({ email });

    if (existing) {
      console.error(
        "An account with this email already exists. No changes made.",
      );
      process.exitCode = 1;
    } else {
      const passwordHash = await bcrypt.hash(password, 12);

      await admins.insertOne({
        name,
        email,
        passwordHash,
        role: "superadmin",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log("Initial superadmin created successfully.");
      console.log("Remove ADMIN_INITIAL_PASSWORD from .env.local now.");
    }
  }
} catch (error) {
  console.error("Admin setup failed:", error);
  process.exitCode = 1;
} finally {
  rl.close();
  await mongoose.disconnect().catch(() => {});
}
