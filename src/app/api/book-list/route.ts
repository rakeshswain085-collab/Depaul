import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../database/mongodb";
import SchoolBook from "@/lib/models/SchoolBook";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const params = request.nextUrl.searchParams;
    const filter: Record<string, unknown> = { published: true };

    const className = params.get("className")?.trim();
    const subject = params.get("subject")?.trim();
    const academicYear = params.get("academicYear")?.trim();
    const search = params.get("search")?.trim();

    if (className) filter.className = className;
    if (subject) filter.subject = subject;
    if (academicYear) filter.academicYear = academicYear;
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { title: { $regex: safe, $options: "i" } },
        { author: { $regex: safe, $options: "i" } },
        { subject: { $regex: safe, $options: "i" } },
        { publisher: { $regex: safe, $options: "i" } },
      ];
    }

    const books = await SchoolBook.find(filter)
      .sort({ className: 1, subject: 1, title: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      books: books.map((book: any) => ({
        id: String(book._id),
        title: book.title,
        author: book.author,
        subject: book.subject,
        className: book.className,
        publisher: book.publisher,
        academicYear: book.academicYear,
        price: book.price ?? null,
      })),
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Public book-list GET:", error);
    return NextResponse.json({ success: false, error: "Unable to load the book list." }, { status: 500 });
  }
}
