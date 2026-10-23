import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";
import { getCurrentAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NoticeRow = {
  id: string;
  title: string;
  description: string;
  date: string;
  pdfUrl: string;
  published: boolean;
  isLatest: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
};

const NOTICE_FIELDS = `id as "_id", title, description, notice_date as date,
  pdf_url as "pdfUrl", published, is_latest as "isLatest",
  created_at as "createdAt", updated_at as "updatedAt"`;

function errorResponse(message: string, status = 400) {
  return NextResponse.json(
    { success: false, error: message },
    {
      status,
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  );
}

function serializeNotice(notice: NoticeRow) {
  return {
    ...notice,
    createdAt: new Date(notice.createdAt).toISOString(),
    updatedAt: new Date(notice.updatedAt).toISOString(),
  };
}

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

export async function GET() {
  try {
    if (!(await getCurrentAdmin())) {
      return errorResponse("Unauthorized. Please log in as an admin.", 401);
    }

    const { rows } = await query<NoticeRow>(
      `select ${NOTICE_FIELDS}
       from notices
       order by is_latest desc, notice_date desc, created_at desc`,
    );

    return NextResponse.json(
      { success: true, notices: rows.map(serializeNotice) },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Admin notices GET error:", error);
    return errorResponse("Unable to load notices.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await getCurrentAdmin())) {
      return errorResponse("Unauthorized. Please log in as an admin.", 401);
    }

    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const date = typeof body.date === "string" ? body.date : "";
    const pdfUrl = typeof body.pdfUrl === "string" ? body.pdfUrl.trim() : "";
    const published = body.published === true;
    const isLatest = body.isLatest === true;

    if (
      !title ||
      title.length > 200 ||
      !description ||
      description.length > 5000 ||
      !validDate(date) ||
      pdfUrl.length > 2048
    ) {
      return errorResponse("Enter a valid title, description, date, and document link.");
    }

    if (isLatest && !published) {
      return errorResponse("Publish the notice before selecting it as Latest.");
    }

    const { rows } = await query<NoticeRow>(
      `insert into notices (title, description, notice_date, pdf_url, published, is_latest)
       values ($1, $2, $3, $4, $5, $6)
       returning ${NOTICE_FIELDS}`,
      [title, description, date, pdfUrl, published, isLatest],
    );

    return NextResponse.json(
      { success: true, notice: serializeNotice(rows[0]) },
      {
        status: 201,
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  } catch (error) {
    console.error("Admin notices POST error:", error);
    return errorResponse("Unable to create notice.", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await getCurrentAdmin())) {
      return errorResponse("Unauthorized. Please log in as an admin.", 401);
    }

    const body = await request.json();
    const id = typeof body.id === "string" ? body.id.trim() : "";

    if (!id || id.length > 100) {
      return errorResponse("A valid notice ID is required.");
    }

    const existingResult = await query<NoticeRow>(
      `select ${NOTICE_FIELDS} from notices where id = $1`,
      [id],
    );
    const existing = existingResult.rows[0];

    if (!existing) {
      return errorResponse("Notice not found.", 404);
    }

    const title =
      typeof body.title === "string" ? body.title.trim() : existing.title;
    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : existing.description;
    const date = typeof body.date === "string" ? body.date : existing.date;
    const pdfUrl =
      typeof body.pdfUrl === "string" ? body.pdfUrl.trim() : existing.pdfUrl;
    const published =
      typeof body.published === "boolean" ? body.published : existing.published;
    let isLatest =
      typeof body.isLatest === "boolean" ? body.isLatest : existing.isLatest;

    if (
      (typeof body.title === "string" && (!title || title.length > 200)) ||
      (typeof body.description === "string" &&
        (!description || description.length > 5000)) ||
      (typeof body.date === "string" && !validDate(date)) ||
      (typeof body.pdfUrl === "string" && pdfUrl.length > 2048)
    ) {
      return errorResponse("Enter a valid title, description, date, and document link.");
    }

    if (isLatest && !published) {
      return errorResponse("Publish the notice before selecting it as Latest.");
    }

    if (body.published === false) {
      isLatest = false;
    }

    const { rows } = await query<NoticeRow>(
      `update notices
       set title = $2, description = $3, notice_date = $4, pdf_url = $5,
           published = $6, is_latest = $7, updated_at = now()
       where id = $1
       returning ${NOTICE_FIELDS}`,
      [id, title, description, date, pdfUrl, published, isLatest],
    );

    return NextResponse.json(
      { success: true, notice: serializeNotice(rows[0]) },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Admin notices PATCH error:", error);
    return errorResponse("Unable to update notice.", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await getCurrentAdmin())) {
      return errorResponse("Unauthorized. Please log in as an admin.", 401);
    }

    const id = request.nextUrl.searchParams.get("id")?.trim() ?? "";

    if (!id || id.length > 100) {
      return errorResponse("A valid notice ID is required.");
    }

    const { rowCount } = await query("delete from notices where id = $1", [id]);

    if (!rowCount) {
      return errorResponse("Notice not found.", 404);
    }

    return NextResponse.json(
      { success: true, message: "Notice deleted successfully." },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Admin notices DELETE error:", error);
    return errorResponse("Unable to delete notice.", 500);
  }
}
