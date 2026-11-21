import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { db, query } from "@/lib/database";
import { deleteStorageFile } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FacilityRow = {
  id: string;
  slug: string;
  photoCategory: string;
  title: string;
  description: string;
  icon: string;
  imageSlot: string | null;
  sortOrder: number;
  published: boolean;
};

type FacilityPayload = Omit<
  FacilityRow,
  "id" | "slug" | "photoCategory" | "imageSlot"
>;

const FACILITY_FIELDS = `id, slug, photo_category as "photoCategory",
  title, description, icon, image_slot as "imageSlot",
  sort_order as "sortOrder", published`;
const MIGRATION_REQUIRED =
  "Campus facilities are not set up yet. Apply backend/supabase/migrations/006_campus_facilities.sql in Supabase.";

function errorResponse(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

function isMissingFacilitiesTable(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "42P01"
  );
}

async function isAdmin() {
  return Boolean(await getCurrentAdmin());
}

function validatePayload(body: unknown):
  | { ok: true; value: FacilityPayload }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid facility data." };
  }

  const data = body as Record<string, unknown>;
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const description =
    typeof data.description === "string" ? data.description.trim() : "";
  const icon = typeof data.icon === "string" ? data.icon.trim() : "";
  const sortOrder = Number(data.sortOrder);
  const published =
    typeof data.published === "boolean" ? data.published : true;

  if (!title || title.length > 100) {
    return { ok: false, error: "Facility name is required (100 characters maximum)." };
  }
  if (description.length > 1000) {
    return { ok: false, error: "Description must be 1,000 characters or fewer." };
  }
  if (Array.from(icon).length > 16) {
    return { ok: false, error: "Icon must be 16 characters or fewer." };
  }
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000) {
    return { ok: false, error: "Display order must be a whole number from 0 to 10,000." };
  }

  return {
    ok: true,
    value: {
      title,
      description,
      icon: icon || "🏫",
      sortOrder,
      published,
    },
  };
}

function createSlug(title: string, suffix: string) {
  const base =
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "facility";
  return `${base}-${suffix}`;
}

export async function GET() {
  try {
    if (!(await isAdmin())) return errorResponse("Unauthorized.", 401);

    const { rows } = await query<FacilityRow>(
      `select ${FACILITY_FIELDS}
       from campus_facilities
       order by sort_order asc, title asc`,
    );
    return NextResponse.json({ success: true, facilities: rows });
  } catch (error) {
    if (isMissingFacilitiesTable(error)) {
      console.warn(MIGRATION_REQUIRED);
      return errorResponse(MIGRATION_REQUIRED, 503);
    }
    console.error("Campus facilities admin GET failed:", error);
    return errorResponse("Unable to load campus facilities.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin())) return errorResponse("Unauthorized.", 401);

    const validated = validatePayload(await request.json());
    if (!validated.ok) return errorResponse(validated.error);

    const id = randomUUID();
    const slug = createSlug(validated.value.title, id.slice(0, 8));
    const photoCategory = `campus-${id}`;
    const { rows } = await query<FacilityRow>(
      `insert into campus_facilities
        (id, slug, photo_category, title, description, icon, sort_order, published)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning ${FACILITY_FIELDS}`,
      [
        id,
        slug,
        photoCategory,
        validated.value.title,
        validated.value.description,
        validated.value.icon,
        validated.value.sortOrder,
        validated.value.published,
      ],
    );
    return NextResponse.json(
      { success: true, facility: rows[0] },
      { status: 201 },
    );
  } catch (error) {
    if (isMissingFacilitiesTable(error)) {
      console.warn(MIGRATION_REQUIRED);
      return errorResponse(MIGRATION_REQUIRED, 503);
    }
    console.error("Campus facilities admin POST failed:", error);
    return errorResponse("Unable to create campus facility.", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await isAdmin())) return errorResponse("Unauthorized.", 401);

    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return errorResponse("Invalid facility data.");
    }

    const data = body as Record<string, unknown>;
    const id = typeof data.id === "string" ? data.id.trim() : "";
    if (!id || id.length > 100) {
      return errorResponse("A valid facility ID is required.");
    }

    const validated = validatePayload(body);
    if (!validated.ok) return errorResponse(validated.error);

    const { rows } = await query<FacilityRow>(
      `update campus_facilities
       set title = $2, description = $3, icon = $4, sort_order = $5,
           published = $6, updated_at = now()
       where id = $1
       returning ${FACILITY_FIELDS}`,
      [
        id,
        validated.value.title,
        validated.value.description,
        validated.value.icon,
        validated.value.sortOrder,
        validated.value.published,
      ],
    );
    if (!rows[0]) return errorResponse("Campus facility not found.", 404);
    return NextResponse.json({ success: true, facility: rows[0] });
  } catch (error) {
    if (isMissingFacilitiesTable(error)) {
      console.warn(MIGRATION_REQUIRED);
      return errorResponse(MIGRATION_REQUIRED, 503);
    }
    console.error("Campus facilities admin PATCH failed:", error);
    return errorResponse("Unable to update campus facility.", 500);
  }
}

export async function DELETE(request: NextRequest) {
  let storagePaths: string[] = [];
  try {
    if (!(await isAdmin())) {
      return errorResponse("Unauthorized.", 401);
    }

    const id = request.nextUrl.searchParams.get("id")?.trim() ?? "";
    if (!id || id.length > 100) {
      return errorResponse("A valid facility ID is required.");
    }

    const client = await db.connect();
    try {
      await client.query("begin");
      const { rows: facilityRows } = await client.query<{
        photoCategory: string;
      }>(
        `select photo_category as "photoCategory"
         from campus_facilities
         where id = $1
         for update`,
        [id],
      );
      if (!facilityRows[0]) {
        await client.query("rollback");
        return errorResponse("Campus facility not found.", 404);
      }

      const { rows: photos } = await client.query<{
        storagePath: string | null;
      }>(
        `delete from gallery
         where category = $1
         returning storage_path as "storagePath"`,
        [facilityRows[0].photoCategory],
      );
      storagePaths = photos.flatMap((photo) =>
        photo.storagePath ? [photo.storagePath] : [],
      );

      await client.query("delete from campus_facilities where id = $1", [id]);
      await client.query("commit");

      const cleanupResults = await Promise.allSettled(
        storagePaths.map((path) => deleteStorageFile("gallery-images", path)),
      );
      const cleanupFailures = cleanupResults.filter(
        (result) => result.status === "rejected",
      );
      cleanupFailures.forEach((result) => {
        if (result.status === "rejected") {
          console.error("Campus facility photo cleanup failed:", result.reason);
        }
      });

      return NextResponse.json({
        success: true,
        warning:
          cleanupFailures.length > 0
            ? `Facility deleted, but ${cleanupFailures.length} photo file(s) could not be removed from storage.`
            : undefined,
      });
    } catch (error) {
      await client.query("rollback").catch((rollbackError: unknown) => {
        console.error("Campus facility delete rollback failed:", rollbackError);
      });
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (isMissingFacilitiesTable(error)) {
      console.warn(MIGRATION_REQUIRED);
      return errorResponse(MIGRATION_REQUIRED, 503);
    }
    console.error("Campus facilities admin DELETE failed:", error);
    return errorResponse("Unable to delete campus facility.", 500);
  }
}
