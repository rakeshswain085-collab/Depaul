
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../database/mongodb";
import SchoolExamResult from "@/lib/models/SchoolExamResult";
import { isValidSchoolClass } from "@/lib/school-classes";

export const dynamic = "force-dynamic";

function isValidAcademicYear(value: string): boolean {
  return /^\d{4}-\d{2}$/.test(value);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const academicYear = (
      searchParams.get("academicYear") ?? ""
    ).trim();

    const className = (searchParams.get("className") ?? "").trim();

    if (!academicYear || !isValidAcademicYear(academicYear)) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid academic year, such as 2026-27." },
        { status: 400 }
      );
    }

    if (!className || !isValidSchoolClass(className)) {
      return NextResponse.json(
        { success: false, message: "Please select a valid class." },
        { status: 400 }
      );
    }

    await connectDB();

    const results = await SchoolExamResult.find({
      academicYear,
      className,
      published: true,
    })
      .select("examinationName examinationKey")
      .sort({ createdAt: -1 })
      .lean();

    // Remove duplicate examination names/keys.
    const seen = new Set<string>();

    const examinations = results
      .filter((exam) => {
        const key = String(
          exam.examinationKey || exam.examinationName || ""
        ).trim();

        if (!key || seen.has(key)) return false;

        seen.add(key);
        return true;
      })
      .map((exam) => ({
        examinationName: exam.examinationName,
        examinationKey: exam.examinationKey,
      }));

    return NextResponse.json({
      success: true,
      examinations,
    });
  } catch (error) {
    console.error("Fetch examinations error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load examinations. Please try again.",
      },
      { status: 500 }
    );
  }
}
