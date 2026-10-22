
import { NextResponse } from "next/server";
import {
  getStaffCollection,
  serializeStaff,
} from "@/lib/staff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const collection = await getStaffCollection();

    const docs = await collection
      .find({ published: true })
      .sort({ category: 1, sortOrder: 1, name: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      staff: docs.map((doc) =>
        serializeStaff(doc as Record<string, unknown>)
      ),
    });
  } catch (error) {
    console.error("GET /api/staff/public:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load published teacher profiles.",
      },
      { status: 500 }
    );
  }
}