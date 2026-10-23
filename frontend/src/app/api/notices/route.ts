
import { NextResponse } from "next/server";
import { query } from "@/lib/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const notices = (await query(`select id as _id, title, description, notice_date as date, pdf_url as "pdfUrl", published, is_latest as "isLatest", created_at as "createdAt", updated_at as "updatedAt" from notices where published=true order by is_latest desc, notice_date desc, created_at desc`)).rows;

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
