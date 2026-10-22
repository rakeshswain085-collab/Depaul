import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../database/mongodb";
import SchoolEvent from "@/lib/models/SchoolEvent";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? "0");
    const limit = Number.isInteger(limitParam) && limitParam > 0
      ? Math.min(limitParam, 50)
      : 0;

    let query = SchoolEvent.find({ published: true })
      .sort({ eventDate: -1, createdAt: -1 })
      .lean();

    if (limit) query = query.limit(limit) as typeof query;

    const events = await query;
    return NextResponse.json({
      success: true,
      events: events.map((event: any) => ({
        id: String(event._id),
        title: event.title,
        description: event.description,
        eventDate: new Date(event.eventDate).toISOString().slice(0, 10),
        venue: event.venue,
        imageUrl: event.imageUrl || "",
        status: event.status,
      })),
    }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Public events GET:", error);
    return NextResponse.json({ success: false, error: "Unable to load events." }, { status: 500 });
  }
}
