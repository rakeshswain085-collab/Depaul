import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { query } from "@/lib/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getText(value: string | null): string {
  return value?.trim() ?? "";
}

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Unauthorized. Sign in as an administrator." },
      { status: 401 },
    );
  }

  const params = request.nextUrl.searchParams;
  const academicYear = getText(params.get("academicYear"));
  const className = getText(params.get("className"));
  const examinationKey = getText(params.get("examinationKey"));
  const rollNumber = getText(params.get("rollNumber"));
  const studentName = getText(params.get("studentName"));
  const published = getText(params.get("published"));

  if (
    !academicYear &&
    !className &&
    !examinationKey &&
    !rollNumber &&
    !studentName
  ) {
    return NextResponse.json(
      { success: false, message: "Provide at least one result search filter." },
      { status: 400 },
    );
  }
  if (academicYear && !/^\d{4}-\d{2}$/.test(academicYear)) {
    return NextResponse.json(
      { success: false, message: "Academic year must use the format YYYY-YY." },
      { status: 400 },
    );
  }
  if (
    className.length > 100 ||
    examinationKey.length > 150 ||
    rollNumber.length > 50 ||
    studentName.length > 150 ||
    !["", "true", "false"].includes(published)
  ) {
    return NextResponse.json(
      { success: false, message: "One or more result search filters are invalid." },
      { status: 400 },
    );
  }

  const filters: string[] = [];
  const values: unknown[] = [];
  const addFilter = (column: string, value: string) => {
    if (!value) return;
    values.push(value);
    filters.push(`${column}=$${values.length}`);
  };
  addFilter("academic_year", academicYear);
  addFilter("class_name", className);
  addFilter("examination_key", examinationKey);
  addFilter("roll_number", rollNumber);
  if (studentName) {
    values.push(`%${studentName}%`);
    filters.push(`student_name ilike $${values.length}`);
  }
  if (published) {
    values.push(published === "true");
    filters.push(`published=$${values.length}`);
  }
  values.push(500);

  try {
    const students = (await query(
      `select academic_year as "academicYear", class_name as "className",
              examination_key as "examinationKey", examination_name as "examinationName",
              examination_date as "examinationDate", serial_number as "serialNumber",
              roll_number as "rollNumber", student_name as "studentName", subjects,
              total_marks as "totalMarks", maximum_marks as "maximumMarks", percentage,
              automatic_grade as "automaticGrade", manual_grade as "manualGrade",
              final_grade as "finalGrade", result_status as "resultStatus",
              published, published_at as "publishedAt", updated_at as "updatedAt"
       from school_exam_results where ${filters.join(" and ")}
       order by academic_year desc, class_name, examination_key, roll_number
       limit $${values.length}`,
      values,
    )).rows;

    return NextResponse.json({
      success: true,
      students,
      count: students.length,
      limit: 500,
    });
  } catch (error) {
    console.error("Admin exam result search error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to load examination student records." },
      { status: 500 },
    );
  }
}
