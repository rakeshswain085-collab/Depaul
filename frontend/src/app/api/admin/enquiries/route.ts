import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { query } from "@/lib/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = [
  "new",
  "in_progress",
  "awaiting_response",
  "replied",
  "follow_up",
  "admitted",
  "not_admitted",
  "closed",
] as const;

type EnquiryStatus = (typeof STATUSES)[number];

type EnquiryRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  status: EnquiryStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
};

const ENQUIRY_FIELDS = `id, name, phone, email, subject, message, status,
  created_at as "createdAt", updated_at as "updatedAt"`;

function errorResponse(error: string, status = 400) {
  return NextResponse.json(
    { success: false, error },
    { status, headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}

function serializeEnquiry(enquiry: EnquiryRow) {
  return {
    ...enquiry,
    createdAt: new Date(enquiry.createdAt).toISOString(),
    updatedAt: new Date(enquiry.updatedAt).toISOString(),
  };
}

export async function GET() {
  try {
    if (!(await getCurrentAdmin())) {
      return errorResponse("Unauthorized. Please log in as an admin.", 401);
    }

    const { rows } = await query<EnquiryRow>(
      `select ${ENQUIRY_FIELDS}
       from admission_enquiries
       order by created_at desc`,
    );

    return NextResponse.json(
      { success: true, enquiries: rows.map(serializeEnquiry) },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Admin admission enquiries GET error:", error);
    return errorResponse("Unable to load admission enquiries.", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await getCurrentAdmin())) {
      return errorResponse("Unauthorized. Please log in as an admin.", 401);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Request body must be valid JSON.");
    }
    if (!body || typeof body !== "object") {
      return errorResponse("Enter a valid enquiry update.");
    }

    const data = body as Record<string, unknown>;
    const id = typeof data.id === "string" ? data.id.trim() : "";
    const status = data.status;

    if (!id || id.length > 100) {
      return errorResponse("A valid enquiry ID is required.");
    }
    if (
      typeof status !== "string" ||
      !STATUSES.includes(status as EnquiryStatus)
    ) {
      return errorResponse("Choose a valid enquiry status.");
    }

    const { rows } = await query<EnquiryRow>(
      `update admission_enquiries
       set status = $2, updated_at = now()
       where id = $1
       returning ${ENQUIRY_FIELDS}`,
      [id, status],
    );

    if (!rows[0]) return errorResponse("Enquiry not found.", 404);

    return NextResponse.json(
      { success: true, enquiry: serializeEnquiry(rows[0]) },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Admin admission enquiries PATCH error:", error);
    return errorResponse("Unable to update enquiry status.", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await getCurrentAdmin())) {
      return errorResponse("Unauthorized. Please log in as an admin.", 401);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Request body must be valid JSON.");
    }
    if (!body || typeof body !== "object") {
      return errorResponse("Select at least one enquiry to delete.");
    }

    const data = body as Record<string, unknown>;
    const ids =
      typeof data.id === "string"
        ? [data.id.trim()]
        : Array.isArray(data.ids)
          ? [...new Set(data.ids.filter((id): id is string => typeof id === "string").map((id) => id.trim()))]
          : [];

    if (
      ids.length === 0 ||
      ids.length > 500 ||
      ids.some((id) => !id || id.length > 100)
    ) {
      return errorResponse("Provide between 1 and 500 valid enquiry IDs.");
    }

    const { rows } = await query<{ id: string }>(
      `delete from admission_enquiries
       where id = any($1::text[])
       returning id`,
      [ids],
    );

    return NextResponse.json(
      { success: true, deletedCount: rows.length },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Admin admission enquiries DELETE error:", error);
    return errorResponse("Unable to delete admission enquiries.", 500);
  }
}
