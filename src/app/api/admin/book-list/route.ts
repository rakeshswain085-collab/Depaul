
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../database/mongodb";
import { getCurrentAdmin } from "@/lib/auth";
import SchoolBook from "@/lib/models/SchoolBook";

export const dynamic = "force-dynamic";

type BookPayload = {
  title?: string;
  author?: string;
  subject?: string;
  className?: string;
  publisher?: string;
  academicYear?: string;
  price?: number;
  published?: boolean;
};

function getBookPayload(body: Record<string, unknown>): BookPayload {
  const payload: BookPayload = {};

  if (typeof body.title === "string") {
    payload.title = body.title.trim();
  }

  if (typeof body.author === "string") {
    payload.author = body.author.trim();
  }

  if (typeof body.subject === "string") {
    payload.subject = body.subject.trim();
  }

  if (typeof body.className === "string") {
    payload.className = body.className.trim();
  }

  if (typeof body.publisher === "string") {
    payload.publisher = body.publisher.trim();
  }

  if (typeof body.academicYear === "string") {
    payload.academicYear = body.academicYear.trim();
  }

  if (body.price !== undefined && body.price !== null && body.price !== "") {
    const price = Number(body.price);

    if (!Number.isFinite(price) || price < 0) {
      throw new Error("Price must be a valid non-negative number.");
    }

    payload.price = price;
  }

  if (typeof body.published === "boolean") {
    payload.published = body.published;
  }

  return payload;
}

// GET: Fetch all books for the admin panel
export async function GET() {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const books = await SchoolBook.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, books });
  } catch (error) {
    console.error("Admin book list GET error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch books." },
      { status: 500 }
    );
  }
}

// POST: Create a book
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const payload = getBookPayload(body);

    if (!payload.title) {
      return NextResponse.json(
        { success: false, message: "Book title is required." },
        { status: 400 }
      );
    }

    await connectDB();

    const book = await SchoolBook.create({
      ...payload,
      author: payload.author ?? "",
      subject: payload.subject ?? "",
      className: payload.className ?? "",
      publisher: payload.publisher ?? "",
      academicYear: payload.academicYear ?? "",
      published: payload.published ?? false,
    });

    return NextResponse.json(
      { success: true, book },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin book list POST error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to create book.";

    const isValidationError =
      message.includes("Price must be") ||
      message.includes("required") ||
      message.includes("validation");

    return NextResponse.json(
      { success: false, message },
      { status: isValidationError ? 400 : 500 }
    );
  }
}

// PATCH: Update a book or its publication status
export async function PATCH(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const id = typeof body.id === "string" ? body.id : "";

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Book ID is required." },
        { status: 400 }
      );
    }

    const payload = getBookPayload(body);

    await connectDB();

    // Fetch a real Mongoose document to preserve document typing.
    const book = await SchoolBook.findById(id);

    if (!book) {
      return NextResponse.json(
        { success: false, message: "Book not found." },
        { status: 404 }
      );
    }

    // Update only fields supplied in the request.
    book.set(payload);
    await book.save();

    return NextResponse.json({
      success: true,
      message: "Book updated successfully.",
      book: book.toObject(),
    });
  } catch (error) {
    console.error("Admin book list PATCH error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to update book.";

    const isClientError =
      message.includes("Price must be") ||
      message.includes("Cast to ObjectId") ||
      message.includes("validation");

    return NextResponse.json(
      { success: false, message },
      { status: isClientError ? 400 : 500 }
    );
  }
}

// DELETE: Delete a book
export async function DELETE(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Book ID is required." },
        { status: 400 }
      );
    }

    await connectDB();

    const deletedBook = await SchoolBook.findByIdAndDelete(id);

    if (!deletedBook) {
      return NextResponse.json(
        { success: false, message: "Book not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Book deleted successfully.",
    });
  } catch (error) {
    console.error("Admin book list DELETE error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete book." },
      { status: 500 }
    );
  }
}
