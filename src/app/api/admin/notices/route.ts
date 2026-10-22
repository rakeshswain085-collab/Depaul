
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "../../../../../database/mongodb";
import Notice from "@/lib/models/Notice";
import { getCurrentAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(message: string, status = 400) {
  return NextResponse.json(
    { success: false, error: message },
    {
      status,
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}

async function requireAdmin() {
  return await getCurrentAdmin();
}

export async function GET() {
  try {
    await connectDB();

    const admin = await requireAdmin();

    if (!admin) {
      return errorResponse("Unauthorized. Please log in as an admin.", 401);
    }

    const notices = await Notice.find({})
      .sort({ isLatest: -1, date: -1, createdAt: -1 })
      .lean()
      .exec();

    return NextResponse.json(
      { success: true, notices },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("Admin notices GET error:", error);
    return errorResponse("Unable to load notices.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const admin = await requireAdmin();

    if (!admin) {
      return errorResponse("Unauthorized. Please log in as an admin.", 401);
    }

    const body = await request.json();

    const title =
      typeof body.title === "string" ? body.title.trim() : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const date = typeof body.date === "string" ? body.date : "";

    const pdfUrl =
      typeof body.pdfUrl === "string" ? body.pdfUrl.trim() : "";

    const published = body.published === true;
    const isLatest = body.isLatest === true;

    if (!title || !description || !date) {
      return errorResponse("Title, description, and date are required.");
    }

    if (isLatest && !published) {
      return errorResponse(
        "Publish the notice before selecting it as Latest."
      );
    }

    // Each notice saves its own Latest status.
    // Do not clear isLatest on other notices.
    const notice = await Notice.create({
      title,
      description,
      date,
      pdfUrl,
      published,
      isLatest,
    });

    return NextResponse.json(
      { success: true, notice },
      {
        status: 201,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  } catch (error) {
    console.error("Admin notices POST error:", error);
    return errorResponse("Unable to create notice.", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    const admin = await requireAdmin();

    if (!admin) {
      return errorResponse("Unauthorized. Please log in as an admin.", 401);
    }

    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";

    if (!id || !Types.ObjectId.isValid(id)) {
      return errorResponse("A valid notice ID is required.");
    }

    const existingNotice = await Notice.findById(id).exec();

    if (!existingNotice) {
      return errorResponse("Notice not found.", 404);
    }

    const update: Record<string, unknown> = {};

    if (typeof body.title === "string") {
      const title = body.title.trim();

      if (!title) {
        return errorResponse("Notice title cannot be empty.");
      }

      update.title = title;
    }

    if (typeof body.description === "string") {
      const description = body.description.trim();

      if (!description) {
        return errorResponse("Notice description cannot be empty.");
      }

      update.description = description;
    }

    if (typeof body.date === "string") {
      if (!body.date) {
        return errorResponse("Notice date is required.");
      }

      update.date = body.date;
    }

    if (typeof body.pdfUrl === "string") {
      update.pdfUrl = body.pdfUrl.trim();
    }

    if (typeof body.published === "boolean") {
      update.published = body.published;
    }

    if (typeof body.isLatest === "boolean") {
      update.isLatest = body.isLatest;
    }

    const willBePublished =
      typeof update.published === "boolean"
        ? update.published
        : existingNotice.published;

    const willBeLatest =
      typeof update.isLatest === "boolean"
        ? update.isLatest
        : existingNotice.isLatest;

    if (willBeLatest && !willBePublished) {
      return errorResponse(
        "Publish the notice before selecting it as Latest."
      );
    }

    // Unpublishing a notice removes its Latest status.
    // Otherwise, preserve the Latest status of all other notices.
    if (update.published === false) {
      update.isLatest = false;
    }

    const notice = await Notice.findByIdAndUpdate(
      id,
      { $set: update },
      {
        new: true,
        runValidators: true,
      }
    )
      .lean()
      .exec();

    return NextResponse.json(
      { success: true, notice },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("Admin notices PATCH error:", error);
    return errorResponse("Unable to update notice.", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const admin = await requireAdmin();

    if (!admin) {
      return errorResponse("Unauthorized. Please log in as an admin.", 401);
    }

    const id = request.nextUrl.searchParams.get("id");

    if (!id || !Types.ObjectId.isValid(id)) {
      return errorResponse("A valid notice ID is required.");
    }

    const notice = await Notice.findByIdAndDelete(id).exec();

    if (!notice) {
      return errorResponse("Notice not found.", 404);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Notice deleted successfully.",
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("Admin notices DELETE error:", error);
    return errorResponse("Unable to delete notice.", 500);
  }
}