import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { query } from "@/lib/database";
import { compareSchoolClasses } from "@/lib/school-classes";
import type { QueryResultRow } from "pg";

export const dynamic = "force-dynamic";

type BookRow = QueryResultRow & {
  id: string;
  title: string;
  author: string;
  subject: string;
  className: string;
  publisher: string;
  academicYear: string;
  price: number | string | null;
  published: boolean;
  createdAt: string;
};

type BookPayload = {
  title?: string;
  author?: string;
  subject?: string;
  className?: string;
  publisher?: string;
  academicYear?: string;
  price?: number | null;
  published?: boolean;
};

const BOOK_COLUMNS = `id, title, author, subject,
  class_name as "className", publisher,
  academic_year as "academicYear", price, published,
  created_at as "createdAt"`;

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function mapBook(book: BookRow) {
  return {
    _id: String(book.id),
    title: book.title,
    author: book.author,
    subject: book.subject,
    className: book.className,
    publisher: book.publisher,
    academicYear: book.academicYear,
    price: book.price == null ? null : Number(book.price),
    published: book.published,
    createdAt: book.createdAt,
  };
}

function parseBookPayload(body: unknown): BookPayload {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new Error("Invalid book details.");
  }

  const input = body as Record<string, unknown>;
  const payload: BookPayload = {};
  const stringFields = [
    ["title", 200],
    ["author", 160],
    ["subject", 100],
    ["className", 40],
    ["publisher", 160],
    ["academicYear", 7],
  ] as const;

  for (const [field, maxLength] of stringFields) {
    const value = input[field];
    if (value === undefined) continue;
    if (typeof value !== "string" || value.trim().length > maxLength) {
      throw new Error(`Invalid ${field}.`);
    }
    payload[field] = value.trim();
  }

  if (input.price !== undefined) {
    if (input.price === null || input.price === "") {
      payload.price = null;
    } else {
      const price = Number(input.price);
      if (!Number.isFinite(price) || price < 0) {
        throw new Error("Price must be a valid non-negative number.");
      }
      payload.price = price;
    }
  }

  if (input.published !== undefined) {
    if (typeof input.published !== "boolean") {
      throw new Error("Published must be true or false.");
    }
    payload.published = input.published;
  }

  return payload;
}

function isClientError(error: unknown) {
  return error instanceof Error && (
    error.message.startsWith("Invalid ") ||
    error.message.startsWith("Price must") ||
    error.message.startsWith("Published must") ||
    error.message.includes("required")
  );
}

export async function GET() {
  try {
    if (!(await getCurrentAdmin())) {
      return errorResponse("Unauthorized.", 401);
    }

    const { rows } = await query<BookRow>(
      `select ${BOOK_COLUMNS} from school_books order by subject, title`,
    );
    rows.sort(
      (left, right) =>
        compareSchoolClasses(left.className, right.className) ||
        left.subject.localeCompare(right.subject) ||
        left.title.localeCompare(right.title),
    );

    return NextResponse.json({ success: true, books: rows.map(mapBook) });
  } catch (error) {
    console.error("Admin book list GET error:", error);
    return errorResponse("Failed to fetch books.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await getCurrentAdmin())) {
      return errorResponse("Unauthorized.", 401);
    }

    const payload = parseBookPayload(await request.json());
    if (
      !payload.title ||
      !payload.author ||
      !payload.subject ||
      !payload.className ||
      !payload.publisher ||
      !payload.academicYear
    ) {
      return errorResponse(
        "Title, author, subject, class, publisher, and academic year are required.",
      );
    }
    if (!/^\d{4}-\d{2}$/.test(payload.academicYear)) {
      return errorResponse("Academic year must use the YYYY-YY format.");
    }

    const { rows } = await query<BookRow>(
      `insert into school_books
        (title, author, subject, class_name, publisher, academic_year, price, published)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning ${BOOK_COLUMNS}`,
      [
        payload.title,
        payload.author,
        payload.subject,
        payload.className,
        payload.publisher,
        payload.academicYear,
        payload.price ?? null,
        payload.published ?? false,
      ],
    );

    return NextResponse.json(
      { success: true, book: mapBook(rows[0]) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Admin book list POST error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to create book.",
      isClientError(error) ? 400 : 500,
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await getCurrentAdmin())) {
      return errorResponse("Unauthorized.", 401);
    }

    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return errorResponse("Invalid book details.");
    }
    const input = body as Record<string, unknown>;
    const id = typeof input.id === "string" ? input.id.trim() : "";
    if (!id) return errorResponse("Book ID is required.");

    const payload = parseBookPayload(input);
    if (payload.academicYear && !/^\d{4}-\d{2}$/.test(payload.academicYear)) {
      return errorResponse("Academic year must use the YYYY-YY format.");
    }

    const assignments: string[] = [];
    const values: unknown[] = [];
    const columns: [keyof BookPayload, string][] = [
      ["title", "title"],
      ["author", "author"],
      ["subject", "subject"],
      ["className", "class_name"],
      ["publisher", "publisher"],
      ["academicYear", "academic_year"],
      ["price", "price"],
      ["published", "published"],
    ];

    for (const [field, column] of columns) {
      if (payload[field] === undefined) continue;
      values.push(payload[field]);
      assignments.push(`${column} = $${values.length}`);
    }
    if (assignments.length === 0) {
      return errorResponse("No book changes were provided.");
    }

    values.push(id);
    const { rows } = await query<BookRow>(
      `update school_books set ${assignments.join(", ")}, updated_at = now()
       where id = $${values.length}
       returning ${BOOK_COLUMNS}`,
      values,
    );
    if (!rows[0]) return errorResponse("Book not found.", 404);

    return NextResponse.json({
      success: true,
      message: "Book updated successfully.",
      book: mapBook(rows[0]),
    });
  } catch (error) {
    console.error("Admin book list PATCH error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to update book.",
      isClientError(error) ? 400 : 500,
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await getCurrentAdmin())) {
      return errorResponse("Unauthorized.", 401);
    }

    const id = request.nextUrl.searchParams.get("id")?.trim();
    if (!id) return errorResponse("Book ID is required.");

    const result = await query(
      "delete from school_books where id = $1",
      [id],
    );
    if (result.rowCount === 0) return errorResponse("Book not found.", 404);

    return NextResponse.json({
      success: true,
      message: "Book deleted successfully.",
    });
  } catch (error) {
    console.error("Admin book list DELETE error:", error);
    return errorResponse("Failed to delete book.", 500);
  }
}
