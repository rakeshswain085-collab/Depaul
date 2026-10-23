
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";
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

    const result = (await query(
      `select academic_year as "academicYear", class_name as "className", examination_name as "examinationName", examination_key as "examinationKey", roll_number as "rollNumber", student_name as "studentName", subjects, total_marks as "totalMarks", maximum_marks as "maximumMarks", percentage, result_status as "resultStatus", published_at as "publishedAt" from school_exam_results where academic_year=$1 and class_name=$2 and roll_number=$3 and published=true and (${examinationKey ? "examination_key=$4" : "examination_name=$4"}) limit 1`,
      [academicYear, className, rollNumber, examinationKey || examinationName],
    )).rows[0];

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
