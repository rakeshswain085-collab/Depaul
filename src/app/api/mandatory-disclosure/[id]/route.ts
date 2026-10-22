import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import {
  DISCLOSURE_COLLECTION,
  getDisclosureBucket,
  getDisclosureDatabase,
  isValidObjectId,
  toDisclosureResponse,
} from "@/lib/mandatory-disclosure";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!isValidObjectId(id)) return fail("Invalid disclosure ID.");

    const body = await request.json();
    const update: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) {
      const title = String(body.title).trim();
      if (!title || title.length > 200) return fail("Invalid title.");
      update.title = title;
    }

    if (body.category !== undefined) {
      const category = String(body.category).trim();
      if (!category || category.length > 100) return fail("Invalid category.");
      update.category = category;
    }

    if (body.description !== undefined) {
      const description = String(body.description).trim();
      if (description.length > 2000) return fail("Description is too long.");
      update.description = description;
    }

    if (body.academicYear !== undefined) {
      const academicYear = String(body.academicYear).trim();
      if (!academicYear || academicYear.length > 30) {
        return fail("Invalid academic year.");
      }
      update.academicYear = academicYear;
    }

    if (body.published !== undefined) {
      if (typeof body.published !== "boolean") {
        return fail("Published must be true or false.");
      }
      update.published = body.published;
    }

    const db = await getDisclosureDatabase();
    const result = await db.collection(DISCLOSURE_COLLECTION).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: "after" }
    );

    if (!result) return fail("Disclosure not found.", 404);

    return NextResponse.json({
      success: true,
      data: toDisclosureResponse(result as Record<string, unknown>),
    });
  } catch (error) {
    console.error("Mandatory disclosure PATCH failed:", error);
    return fail("Unable to update the disclosure.", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!isValidObjectId(id)) return fail("Invalid disclosure ID.");

    const db = await getDisclosureDatabase();
    const collection = db.collection(DISCLOSURE_COLLECTION);
    const doc = await collection.findOne({ _id: new ObjectId(id) });

    if (!doc) return fail("Disclosure not found.", 404);

    await collection.deleteOne({ _id: new ObjectId(id) });

    // Keep a file if another disclosure record still references it.
    const stillUsed = await collection.findOne({ fileId: doc.fileId });

    if (!stillUsed && doc.fileId instanceof ObjectId) {
      const bucket = await getDisclosureBucket();

      try {
        await bucket.delete(doc.fileId);
      } catch (error) {
        console.error("Could not delete the associated GridFS file:", error);
      }
    }

    return NextResponse.json({ success: true, message: "Disclosure deleted." });
  } catch (error) {
    console.error("Mandatory disclosure DELETE failed:", error);
    return fail("Unable to delete the disclosure.", 500);
  }
}