
import { NextRequest, NextResponse } from "next/server";
import {
  getStaffCollection,
  isStaffCategory,
  serializeStaff,
} from "@/lib/staff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StaffCategory = "PGT" | "TGT" | "PRT";

function normalizeCategory(value: unknown): StaffCategory | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toUpperCase();

  const categoryMap: Record<string, StaffCategory> = {
    PGT: "PGT",
    "PGT TEACHERS": "PGT",
    TGT: "TGT",
    "TGT TEACHERS": "TGT",
    PRT: "PRT",
    "PRT TEACHERS": "PRT",
  };

  const mapped = categoryMap[normalized];

  if (mapped && isStaffCategory(mapped)) {
    return mapped;
  }

  return null;
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET() {
  try {
    const collection = await getStaffCollection();

    const docs = await collection
      .find({})
      .sort({ category: 1, sortOrder: 1, name: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      staff: docs.map((doc) =>
        serializeStaff(doc as Record<string, unknown>)
      ),
    });
  } catch (error) {
    console.error("GET /api/staff:", error);
    return errorResponse("Unable to load staff records.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const designation =
      typeof body.designation === "string"
        ? body.designation.trim()
        : "";

    const subject =
      typeof body.subject === "string" ? body.subject.trim() : "";

    const category = normalizeCategory(body.category);

    const photoId =
      typeof body.photoId === "string"
        ? body.photoId.trim()
        : "";

    const sortOrder =
      body.sortOrder !== undefined &&
      body.sortOrder !== null &&
      body.sortOrder !== "" &&
      Number.isFinite(Number(body.sortOrder))
        ? Number(body.sortOrder)
        : 0;

    if (!name) {
      return errorResponse("Teacher name is required.");
    }

    if (!designation) {
      return errorResponse("Teacher designation is required.");
    }

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: "Select a valid teacher category.",
          acceptedCategories: ["PGT", "TGT", "PRT"],
          receivedCategory: body.category ?? null,
        },
        { status: 400 }
      );
    }

    if (name.length > 150 || designation.length > 150 || subject.length > 150) {
      return errorResponse(
        "Name, designation, and subject must each be 150 characters or fewer."
      );
    }

    if (photoId && !/^[a-f\d]{24}$/i.test(photoId)) {
      return errorResponse("Invalid teacher photo ID.");
    }

    const doc = {
      name,
      designation,
      subject,
      category,
      photoId: photoId || null,
      published: body.published === true,
      sortOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const collection = await getStaffCollection();
    const result = await collection.insertOne(doc);

    return NextResponse.json(
      {
        success: true,
        staff: serializeStaff({
          ...doc,
          _id: result.insertedId,
        }),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/staff:", error);

    if (error instanceof SyntaxError) {
      return errorResponse("Request body must contain valid JSON.");
    }

    return errorResponse("Unable to create staff record.", 500);
  }
}