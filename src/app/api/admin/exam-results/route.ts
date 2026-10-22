
import { NextResponse } from "next/server";
import { connectDB } from "../../../../../database/mongodb";
import { getCurrentAdmin } from "@/lib/auth";
import SchoolExamResult from "@/lib/models/SchoolExamResult";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function unauthorized() {
  return NextResponse.json(
    { success: false, message: "Unauthorized. Sign in as an administrator." },
    { status: 401 },
  );
}

// GET: List uploaded examinations, filtered by academic year and class.
export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();

  try {
    const params = new URL(request.url).searchParams;
    const academicYear = getText(params.get("academicYear"));
    const className = getText(params.get("className"));

    await connectDB();

    const filter: Record<string, unknown> = {};

    if (academicYear) filter.academicYear = academicYear;
    if (className) filter.className = className;

    const records = await SchoolExamResult.find(filter)
      .select(
        "academicYear className examinationKey examinationName published publishedAt createdAt updatedAt",
      )
      .sort({ academicYear: -1, updatedAt: -1 })
      .limit(10000)
      .lean();

    // Each examination may contain many student documents.
    // Group them into one examination entry for the admin dashboard.
    const grouped = new Map<
      string,
      {
        academicYear: string;
        className: string;
        examinationKey: string;
        examinationName: string;
        studentCount: number;
        publishedCount: number;
        published: boolean;
        publishedAt: Date | null;
        createdAt: Date | null;
        updatedAt: Date | null;
      }
    >();

    for (const record of records) {
      const key = [
        record.academicYear,
        record.className,
        record.examinationKey,
      ].join("::");

      const existing = grouped.get(key);

      if (existing) {
        existing.studentCount += 1;

        if (record.published) {
          existing.publishedCount += 1;
        }

        existing.published =
          existing.published || Boolean(record.published);

        if (
          record.publishedAt &&
          (!existing.publishedAt ||
            new Date(record.publishedAt) > new Date(existing.publishedAt))
        ) {
          existing.publishedAt = record.publishedAt;
        }

        if (
          record.updatedAt &&
          (!existing.updatedAt ||
            new Date(record.updatedAt) > new Date(existing.updatedAt))
        ) {
          existing.updatedAt = record.updatedAt;
        }

        continue;
      }

      grouped.set(key, {
        academicYear: record.academicYear,
        className: record.className,
        examinationKey: record.examinationKey,
        examinationName: record.examinationName,
        studentCount: 1,
        publishedCount: record.published ? 1 : 0,
        published: Boolean(record.published),
        publishedAt: record.publishedAt ?? null,
        createdAt: record.createdAt ?? null,
        updatedAt: record.updatedAt ?? null,
      });
    }

    const examinations = Array.from(grouped.values()).sort((a, b) => {
      const yearOrder = b.academicYear.localeCompare(a.academicYear);
      if (yearOrder !== 0) return yearOrder;

      const classOrder = a.className.localeCompare(b.className, undefined, {
        numeric: true,
      });
      if (classOrder !== 0) return classOrder;

      return (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0);
    });

    return NextResponse.json({
      success: true,
      examinations,
      total: examinations.length,
    });
  } catch (error) {
    console.error("List examinations error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load examinations." },
      { status: 500 },
    );
  }
}

// PATCH: Publish, unpublish, or delete an entire examination.
export async function PATCH(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return unauthorized();

  try {
    const body = await request.json();

    const action = getText(body.action).toLowerCase();
    const academicYear = getText(body.academicYear);
    const className = getText(body.className);
    const examinationKey = getText(body.examinationKey);

    if (!academicYear || !className || !examinationKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Academic year, class, and examination are required.",
        },
        { status: 400 },
      );
    }

    if (!["publish", "unpublish", "delete"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          message: "Action must be publish, unpublish, or delete.",
        },
        { status: 400 },
      );
    }

    await connectDB();

    const filter = { academicYear, className, examinationKey };

    const existingCount = await SchoolExamResult.countDocuments(filter);

    if (existingCount === 0) {
      return NextResponse.json(
        { success: false, message: "No matching examination was found." },
        { status: 404 },
      );
    }

    if (action === "delete") {
      const result = await SchoolExamResult.deleteMany(filter);

      return NextResponse.json({
        success: true,
        message: `Examination deleted. ${result.deletedCount} student result(s) removed.`,
        deletedCount: result.deletedCount,
      });
    }

    const now = new Date();
    const publish = action === "publish";

    await SchoolExamResult.updateMany(filter, {
      $set: {
        published: publish,
        publishedAt: publish ? now : null,
        updatedAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      message: publish
        ? "All student results for this examination have been published."
        : "All student results for this examination have been unpublished.",
      updatedCount: existingCount,
      published: publish,
    });
  } catch (error) {
    console.error("Update examination error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update the examination." },
      { status: 500 },
    );
  }
}
