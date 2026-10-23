import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";
import { compareSchoolClasses } from "@/lib/school-classes";
import type { QueryResultRow } from "pg";

export const dynamic = "force-dynamic";

type PublicBookRow = QueryResultRow & {
  id: string;
  title: string;
  author: string;
  subject: string;
  className: string;
  publisher: string;
  academicYear: string;
  price: number | string | null;
};

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const values = [
      params.get("className")?.trim() || "",
      params.get("subject")?.trim() || "",
      params.get("academicYear")?.trim() || "",
      params.get("search")?.trim() || "",
    ];
    const { rows } = await query<PublicBookRow>(
      `select id, title, author, subject,
              class_name as "className", publisher,
              academic_year as "academicYear", price
       from school_books
       where published = true
         and ($1 = '' or class_name = $1)
         and ($2 = '' or subject = $2)
         and ($3 = '' or academic_year = $3)
         and ($4 = '' or concat_ws(' ', title, author, subject, publisher) ilike '%' || $4 || '%')
       order by subject, title`,
      values,
    );
    rows.sort(
      (left, right) =>
        compareSchoolClasses(left.className, right.className) ||
        left.subject.localeCompare(right.subject) ||
        left.title.localeCompare(right.title),
    );

    return NextResponse.json({
      success: true,
      books: rows.map((book) => ({
        id: String(book.id),
        title: book.title,
        author: book.author,
        subject: book.subject,
        className: book.className,
        publisher: book.publisher,
        academicYear: book.academicYear,
        price: book.price == null ? null : Number(book.price),
      })),
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Public book-list GET:", error);
    return NextResponse.json({ success: false, error: "Unable to load the book list." }, { status: 500 });
  }
}
