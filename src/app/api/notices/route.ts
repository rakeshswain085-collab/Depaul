
import { NextResponse } from "next/server";
import { connectDB } from "../../../../database/mongodb";
import Notice from "@/lib/models/Notice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const notices = await Notice.find({ published: true })
      .sort({ isLatest: -1, date: -1, createdAt: -1 })
      .lean()
      .exec();

    return NextResponse.json(
      { success: true, notices },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("Public notices API error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load notices." },
      { status: 500 }
    );
  }
}
