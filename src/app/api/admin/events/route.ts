
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "../../../../../database/mongodb";
import { getCurrentAdmin } from "@/lib/auth";
import SchoolEvent from "@/lib/models/SchoolEvent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EventStatus = "Upcoming" | "Completed";

type EventPayload = {
  title: string;
  description: string;
  eventDate: Date;
  venue: string;
  imageUrl: string;
  status: EventStatus;
  published: boolean;
};

type ValidationResult =
  | { ok: true; value: EventPayload }
  | { ok: false; error: string };

function serialize(event: any) {
  return {
    _id: String(event._id),
    title: event.title,
    description: event.description,
    eventDate: new Date(event.eventDate).toISOString().slice(0, 10),
    venue: event.venue,
    imageUrl: event.imageUrl || "",
    status: event.status,
    published: Boolean(event.published),
    createdAt: event.createdAt ?? null,
    updatedAt: event.updatedAt ?? null,
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
  const dateText =
    typeof data.eventDate === "string" ? data.eventDate.trim() : "";
  const venue = typeof data.venue === "string" ? data.venue.trim() : "";
  const imageUrl =
    typeof data.imageUrl === "string" ? data.imageUrl.trim() : "";

  const status: EventStatus =
    data.status === "Completed" ? "Completed" : "Upcoming";

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

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    return { ok: false, error: "Enter a valid event date." };
  }

  const parsedDate = new Date(`${dateText}T00:00:00.000Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== dateText
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

  return {
    ok: true,
    value: {
      title,
      description,
      eventDate: parsedDate,
      venue,
      imageUrl,
      status,
      published,
    },
  };
}

// GET: List all events for authenticated administrators.
export async function GET() {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    await connectDB();

    const events = await SchoolEvent.find({})
      .sort({ eventDate: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      events: events.map(serialize),
    });
  } catch (error) {
    console.error("Admin events GET:", error);

    return NextResponse.json(
      { success: false, error: "Unable to load events." },
      { status: 500 }
    );
  }
}

// POST: Create a new event.
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body: unknown = await request.json();
    const validated = validatePayload(body);

    if (!validated.ok) {
      return NextResponse.json(
        { success: false, error: validated.error },
        { status: 400 }
      );
    }

    await connectDB();

    const event = await SchoolEvent.create(validated.value);

    return NextResponse.json(
      {
        success: true,
        event: serialize(event.toObject()),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin events POST:", error);

    return NextResponse.json(
      { success: false, error: "Unable to create event." },
      { status: 500 }
    );
  }
}

// PATCH: Edit an event or publish/unpublish it.
export async function PATCH(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body: unknown = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request data." },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;
    const id = typeof data.id === "string" ? data.id : "";

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "A valid event ID is required." },
        { status: 400 }
      );
    }

    await connectDB();

    // Publication-only request.
    const keys = Object.keys(data);
    const publicationOnly =
      typeof data.published === "boolean" &&
      keys.every((key) => ["id", "published"].includes(key));

    if (publicationOnly) {
      const event = await SchoolEvent.findByIdAndUpdate(
        id,
        { $set: { published: data.published } },
        { new: true, runValidators: true }
      ).lean();

      if (!event) {
        return NextResponse.json(
          { success: false, error: "Event not found." },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        event: serialize(event),
      });
    }

    // Full event update.
    const validated = validatePayload(body);

    if (!validated.ok) {
      return NextResponse.json(
        { success: false, error: validated.error },
        { status: 400 }
      );
    }

    const event = await SchoolEvent.findByIdAndUpdate(
      id,
      { $set: validated.value },
      { new: true, runValidators: true }
    ).lean();

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      event: serialize(event),
    });
  } catch (error) {
    console.error("Admin events PATCH:", error);

    return NextResponse.json(
      { success: false, error: "Unable to update event." },
      { status: 500 }
    );
  }
}

// DELETE: Permanently delete an event.
export async function DELETE(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    const id = request.nextUrl.searchParams.get("id") ?? "";

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "A valid event ID is required." },
        { status: 400 }
      );
    }

    await connectDB();

    const event = await SchoolEvent.findByIdAndDelete(id);

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully.",
    });
  } catch (error) {
    console.error("Admin events DELETE:", error);

    return NextResponse.json(
      { success: false, error: "Unable to delete event." },
      { status: 500 }
    );
  }
}