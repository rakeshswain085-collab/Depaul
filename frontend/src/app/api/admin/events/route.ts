import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";
import { getCurrentAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EventStatus = "Upcoming" | "Completed";

type EventRow = {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  venue: string;
  imageUrl: string;
  status: EventStatus;
  published: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type EventPayload = Omit<EventRow, "id" | "createdAt" | "updatedAt">;

type ValidationResult =
  | { ok: true; value: EventPayload }
  | { ok: false; error: string };

const EVENT_FIELDS = `id as "_id", title, description,
  event_date::text as "eventDate", venue, image_url as "imageUrl",
  status, published, created_at as "createdAt", updated_at as "updatedAt"`;

function serialize(event: EventRow) {
  return {
    ...event,
    createdAt: new Date(event.createdAt).toISOString(),
    updatedAt: new Date(event.updatedAt).toISOString(),
  };
}

function validatePayload(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid event data." };
  }

  const data = body as Record<string, unknown>;
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const description =
    typeof data.description === "string" ? data.description.trim() : "";
  const eventDate =
    typeof data.eventDate === "string" ? data.eventDate.trim() : "";
  const venue = typeof data.venue === "string" ? data.venue.trim() : "";
  const imageUrl =
    typeof data.imageUrl === "string" ? data.imageUrl.trim() : "";
  const status = data.status;
  const published = data.published === true;

  if (!title || title.length > 160) {
    return {
      ok: false,
      error: "Title is required (maximum 160 characters).",
    };
  }

  if (!description || description.length > 5000) {
    return {
      ok: false,
      error: "Description is required (maximum 5000 characters).",
    };
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(eventDate) ||
    Number.isNaN(Date.parse(`${eventDate}T00:00:00.000Z`)) ||
    new Date(`${eventDate}T00:00:00.000Z`).toISOString().slice(0, 10) !==
      eventDate
  ) {
    return { ok: false, error: "Enter a valid event date." };
  }

  if (!venue || venue.length > 250) {
    return {
      ok: false,
      error: "Venue is required (maximum 250 characters).",
    };
  }

  if (imageUrl.length > 1000) {
    return { ok: false, error: "Image URL is too long." };
  }

  if (
    imageUrl &&
    !imageUrl.startsWith("/") &&
    !/^https?:\/\//i.test(imageUrl)
  ) {
    return {
      ok: false,
      error: "Image URL must start with / or use http:// or https://.",
    };
  }

  if (status !== "Upcoming" && status !== "Completed") {
    return { ok: false, error: "Choose a valid event status." };
  }

  return {
    ok: true,
    value: {
      title,
      description,
      eventDate,
      venue,
      imageUrl,
      status,
      published,
    },
  };
}

function responseError(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

async function isAdmin() {
  return Boolean(await getCurrentAdmin());
}

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return responseError("Unauthorized.", 401);
    }

    const { rows } = await query<EventRow>(
      `select ${EVENT_FIELDS}
       from school_events
       order by event_date desc, created_at desc`,
    );

    return NextResponse.json({
      success: true,
      events: rows.map(serialize),
    });
  } catch (error) {
    console.error("Admin events GET:", error);
    return responseError("Unable to load events.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return responseError("Unauthorized.", 401);
    }

    const validated = validatePayload(await request.json());
    if (!validated.ok) {
      return responseError(validated.error);
    }

    const event = validated.value;
    const { rows } = await query<EventRow>(
      `insert into school_events
        (title, description, event_date, venue, image_url, status, published)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning ${EVENT_FIELDS}`,
      [
        event.title,
        event.description,
        event.eventDate,
        event.venue,
        event.imageUrl,
        event.status,
        event.published,
      ],
    );

    return NextResponse.json(
      { success: true, event: serialize(rows[0]) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Admin events POST:", error);
    return responseError("Unable to create event.", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return responseError("Unauthorized.", 401);
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return responseError("Invalid request data.");
    }

    const data = body as Record<string, unknown>;
    const id = typeof data.id === "string" ? data.id.trim() : "";
    if (!id || id.length > 100) {
      return responseError("A valid event ID is required.");
    }

    const publicationOnly =
      typeof data.published === "boolean" &&
      Object.keys(data).every((key) => ["id", "published"].includes(key));

    if (publicationOnly) {
      const { rows } = await query<EventRow>(
        `update school_events
         set published = $2, updated_at = now()
         where id = $1
         returning ${EVENT_FIELDS}`,
        [id, data.published],
      );
      if (!rows[0]) return responseError("Event not found.", 404);
      return NextResponse.json({ success: true, event: serialize(rows[0]) });
    }

    const validated = validatePayload(body);
    if (!validated.ok) {
      return responseError(validated.error);
    }

    const event = validated.value;
    const { rows } = await query<EventRow>(
      `update school_events
       set title = $2, description = $3, event_date = $4, venue = $5,
           image_url = $6, status = $7, published = $8, updated_at = now()
       where id = $1
       returning ${EVENT_FIELDS}`,
      [
        id,
        event.title,
        event.description,
        event.eventDate,
        event.venue,
        event.imageUrl,
        event.status,
        event.published,
      ],
    );
    if (!rows[0]) return responseError("Event not found.", 404);

    return NextResponse.json({ success: true, event: serialize(rows[0]) });
  } catch (error) {
    console.error("Admin events PATCH:", error);
    return responseError("Unable to update event.", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return responseError("Unauthorized.", 401);
    }

    const id = request.nextUrl.searchParams.get("id")?.trim() ?? "";
    if (!id || id.length > 100) {
      return responseError("A valid event ID is required.");
    }

    const { rowCount } = await query(
      "delete from school_events where id = $1",
      [id],
    );
    if (!rowCount) return responseError("Event not found.", 404);

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully.",
    });
  } catch (error) {
    console.error("Admin events DELETE:", error);
    return responseError("Unable to delete event.", 500);
  }
}
