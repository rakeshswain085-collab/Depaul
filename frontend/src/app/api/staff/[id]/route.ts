import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";
import { deleteStorageFile, publicStorageUrl } from "@/lib/storage";
import {
  isStaffCategory,
  isValidStaffPhotoPath,
  normalizeStaffCategory,
  STAFF_PHOTO_BUCKET,
} from "@/lib/staff";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

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

function responseError(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

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

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    if (!id || id.length > 100) return responseError("Invalid staff ID.", 400);

    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return responseError("Invalid request data.", 400);
    }
    const data = body as Record<string, unknown>;
    const updates = new Map<string, unknown>();

    if (data.name !== undefined) {
      if (typeof data.name !== "string" || !data.name.trim() || data.name.trim().length > 150) {
        return responseError("Enter a valid name (maximum 150 characters).");
      }
      updates.set("name", data.name.trim());
    }
    if (data.designation !== undefined) {
      if (typeof data.designation !== "string" || !data.designation.trim() || data.designation.trim().length > 150) {
        return responseError("Enter a valid designation (maximum 150 characters).");
      }
      updates.set("designation", data.designation.trim());
    }
    if (data.subject !== undefined) {
      if (typeof data.subject !== "string" || data.subject.trim().length > 150) {
        return responseError("Subject must be 150 characters or fewer.");
      }
      updates.set("subject", data.subject.trim());
    }
    if (data.category !== undefined) {
      const category = normalizeStaffCategory(data.category);
      if (!category || !isStaffCategory(category)) return responseError("Invalid category.");
      updates.set("category", category);
    }
    if (data.photoId !== undefined) {
      if (data.photoId !== null && data.photoId !== "" &&
          (typeof data.photoId !== "string" || !isValidStaffPhotoPath(data.photoId))) {
        return responseError("Invalid photo ID.");
      }
      updates.set("photo_path", data.photoId || null);
    }
    if (data.published !== undefined) {
      if (typeof data.published !== "boolean") return responseError("Published must be true or false.");
      updates.set("published", data.published);
    }
    if (data.sortOrder !== undefined) {
      const sortOrder = Number(data.sortOrder);
      if (!Number.isFinite(sortOrder)) return responseError("Sort order must be a number.");
      updates.set("sort_order", sortOrder);
    }

    if (updates.size === 0) return responseError("No valid fields to update.");

    const columns = [...updates.keys()];
    const values: unknown[] = [id, ...updates.values()];
    const assignments = columns.map(
      (column, index) => `${column} = $${index + 2}`,
    );
    assignments.push("updated_at = now()");
    const { rows } = await query<StaffRow>(
      `update school_staff
       set ${assignments.join(", ")}
       where id = $1
       returning ${STAFF_FIELDS}`,
      values,
    );

    if (!rows[0]) return responseError("Staff record not found.", 404);
    return NextResponse.json({ staff: serializeStaff(rows[0]) });
  } catch (error) {
    console.error("PATCH /api/staff/[id]:", error);
    return responseError("Unable to update staff record.", 500);
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    if (!id || id.length > 100) return responseError("Invalid staff ID.", 400);

    const { rows } = await query<{ photoPath: string | null }>(
      `delete from school_staff
       where id = $1
       returning photo_path as "photoPath"`,
      [id],
    );
    const record = rows[0];
    if (!record) return responseError("Staff record not found.", 404);

    if (record.photoPath) {
      const { rows: references } = await query<{ used: boolean }>(
        "select exists(select 1 from school_staff where photo_path = $1) as used",
        [record.photoPath],
      );
      if (!references[0]?.used) {
        await deleteStorageFile(STAFF_PHOTO_BUCKET, record.photoPath);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/staff/[id]:", error);
    return responseError("Unable to delete staff record.", 500);
  }
}
