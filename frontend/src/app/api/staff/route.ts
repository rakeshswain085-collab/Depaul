import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";
import { publicStorageUrl } from "@/lib/storage";
import {
  isStaffCategory,
  normalizeStaffCategory,
  STAFF_PHOTO_BUCKET,
} from "@/lib/staff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StaffRow = {
  id: string;
  name: string;
  designation: string;
  subject: string;
  category: string;
  photoPath: string | null;
  published: boolean;
  sortOrder: number;
  createdAt: Date | string;
  updatedAt: Date | string;
};

const STAFF_FIELDS = `id, name, designation, subject, category,
  photo_path as "photoPath", published, sort_order as "sortOrder",
  created_at as "createdAt", updated_at as "updatedAt"`;

function serializeStaff(row: StaffRow) {
  return {
    _id: row.id,
    name: row.name,
    designation: row.designation,
    subject: row.subject,
    category: normalizeStaffCategory(row.category) ?? "PGT Teachers",
    photoId: row.photoPath ?? "",
    photoUrl: row.photoPath
      ? publicStorageUrl(STAFF_PHOTO_BUCKET, row.photoPath)
      : "",
    published: row.published,
    sortOrder: row.sortOrder,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

function errorResponse(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function GET() {
  try {
    const { rows } = await query<StaffRow>(
      `select ${STAFF_FIELDS}
       from school_staff
       order by category, sort_order, name`,
    );
    return NextResponse.json({
      success: true,
      staff: rows.map(serializeStaff),
    });
  } catch (error) {
    console.error("GET /api/staff:", error);
    return errorResponse("Unable to load staff records.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const designation =
      typeof body.designation === "string" ? body.designation.trim() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const category = normalizeStaffCategory(body.category);
    const photoPath =
      typeof body.photoId === "string" ? body.photoId.trim() : "";
    const sortOrder =
      body.sortOrder !== undefined &&
      body.sortOrder !== null &&
      body.sortOrder !== "" &&
      Number.isFinite(Number(body.sortOrder))
        ? Number(body.sortOrder)
        : 0;

    if (!name) return errorResponse("Teacher name is required.");
    if (!designation) return errorResponse("Teacher designation is required.");
    if (!category || !isStaffCategory(category)) {
      return errorResponse("Select a valid teacher category.");
    }
    if (name.length > 150 || designation.length > 150 || subject.length > 150) {
      return errorResponse(
        "Name, designation, and subject must each be 150 characters or fewer.",
      );
    }
    if (photoPath && !/^[\w-]+\.(?:webp|jpe?g|png)$/i.test(photoPath)) {
      return errorResponse("Invalid teacher photo ID.");
    }

    const { rows } = await query<StaffRow>(
      `insert into school_staff
        (name, designation, subject, category, photo_path, published, sort_order)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning ${STAFF_FIELDS}`,
      [
        name,
        designation,
        subject,
        category,
        photoPath || null,
        body.published === true,
        sortOrder,
      ],
    );

    return NextResponse.json(
      { success: true, staff: serializeStaff(rows[0]) },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/staff:", error);
    if (error instanceof SyntaxError) {
      return errorResponse("Request body must contain valid JSON.");
    }
    return errorResponse("Unable to create staff record.", 500);
  }
}
