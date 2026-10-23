import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? "0");
    const limit = Number.isInteger(limitParam) && limitParam > 0
      ? Math.min(limitParam, 50)
      : 0;

    const events = (await query<any>(`select id,title,description,event_date::text as "eventDate",venue,image_url as "imageUrl",status from school_events where published=true order by event_date desc,created_at desc${limit ? " limit $1" : ""}`, limit ? [limit] : [])).rows;
    return NextResponse.json({
      success: true,
      events: events.map((event: any) => ({
        id: String(event.id),
        title: event.title,
        description: event.description,
        eventDate: event.eventDate,
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
