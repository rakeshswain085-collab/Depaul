import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import {
  DISCLOSURE_COLLECTION,
  getDisclosureDatabase,
  toDisclosureResponse,
} from "@/lib/mandatory-disclosure";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function GET() {
  try {
    const db = await getDisclosureDatabase();

    const documents = await db
      .collection(DISCLOSURE_COLLECTION)
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: documents.map((doc) =>
        toDisclosureResponse(doc as Record<string, unknown>)
      ),
    });
  } catch (error) {
    console.error("Mandatory disclosure GET failed:", error);
    return errorResponse("Unable to load disclosures.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const title = String(body.title ?? "").trim();
    const category = String(body.category ?? "").trim();
    const description = String(body.description ?? "").trim();
    const academicYear = String(body.academicYear ?? "").trim();
    const fileId = String(body.fileId ?? "").trim();
    const fileName = String(body.fileName ?? "").trim();
    const fileSize = Number(body.fileSize ?? 0);
    const published = body.published === true;

    if (!title || !category || !academicYear || !fileId || !fileName) {
      return errorResponse("Title, category, academic year, and uploaded PDF are required.");
    }

    if (title.length > 200 || category.length > 100 || description.length > 2000) {
      return errorResponse("One or more text fields are too long.");
    }

    if (!/^[a-f\d]{24}$/i.test(fileId)) {
      return errorResponse("Invalid uploaded file ID.");
    }

    if (!Number.isFinite(fileSize) || fileSize < 1 || fileSize > 10 * 1024 * 1024) {
      return errorResponse("The PDF must be smaller than 10 MB.");
    }

    const db = await getDisclosureDatabase();

    const fileExists = await db
      .collection("mandatoryDisclosureFiles.files")
      .findOne({
        _id: new ObjectId(fileId),
        contentType: "application/pdf",
      });

    if (!fileExists) {
      return errorResponse("The uploaded PDF was not found in GridFS.");
    }

    const now = new Date();

    const document = {
      title,
      category,
      description,
      academicYear,
      fileId: new ObjectId(fileId),
      fileName,
      contentType: "application/pdf",
      fileSize,
      published,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db
      .collection(DISCLOSURE_COLLECTION)
      .insertOne(document);

    return NextResponse.json(
      {
        success: true,
        data: toDisclosureResponse({
          ...document,
          _id: result.insertedId,
        }),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Mandatory disclosure POST failed:", error);
    return errorResponse("Unable to save the disclosure.", 500);
  }
}