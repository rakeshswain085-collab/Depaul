
import { NextResponse } from "next/server";
import { query } from "@/lib/database";

export async function GET() {
  try {
    await query("select 1");

    return NextResponse.json({
      success: true,
      message: "Supabase Postgres connected successfully",
    });
  } catch (error) {
    console.error("Supabase Postgres connection failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Supabase Postgres connection failed. Check your terminal.",
      },
      { status: 500 },
    );
  }
}
