
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

    const examinationKey = (
      searchParams.get("examinationKey") ?? ""
    ).trim();

    const examinationName = (
      searchParams.get("examinationName") ?? ""
    ).trim();

    const rollNumber = (
      searchParams.get("rollNumber") ?? ""
    ).trim();

    if (!academicYear || !isValidAcademicYear(academicYear)) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid academic year." },
        { status: 400 }
      );
    }

    if (!className || !isValidSchoolClass(className)) {
      return NextResponse.json(
        { success: false, message: "Please select a valid class." },
        { status: 400 }
      );
    }

    if (!examinationKey && !examinationName) {
      return NextResponse.json(
        { success: false, message: "Please select an examination." },
        { status: 400 }
      );
    }

    if (!rollNumber) {
      return NextResponse.json(
        { success: false, message: "Please enter your roll number." },
        { status: 400 }
      );
    }

    await connectDB();

    const examinationFilter = examinationKey
      ? { examinationKey }
      : { examinationName };

    const result = await SchoolExamResult.findOne({
      academicYear,
      className,
      ...examinationFilter,
      rollNumber,
      published: true,
    }).lean();

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No published result was found. Check your details or contact the school office.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Student result lookup error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve the result. Please try again.",
      },
      { status: 500 }
    );
  }
}
