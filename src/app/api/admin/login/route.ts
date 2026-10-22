
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/../database/mongodb";
import Admin from "@/lib/models/Admin";
import { createAdminSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // Reject cross-origin browser requests.
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (origin && host && new URL(origin).host !== host) {
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";
    const password =
      typeof body.password === "string" ? body.password : "";

    if (
      !email ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !password ||
      password.length > 200
    ) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 400 },
      );
    }

    await connectDB();

    const admin = await Admin.findOne({ email })
      .select("+passwordHash")
      .exec();

    if (
      !admin ||
      !admin.isActive ||
      !(await bcrypt.compare(password, admin.passwordHash))
    ) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    await createAdminSession(String(admin._id));

    return NextResponse.json({
      success: true,
      redirectTo: "/admin/dashboard",
    });
  } catch (error) {
    console.error("Admin login failed:", error);

    return NextResponse.json(
      { error: "Unable to sign in. Check the server configuration." },
      { status: 500 },
    );
  }
}
