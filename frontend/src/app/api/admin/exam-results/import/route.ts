import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import { getCurrentAdmin } from "@/lib/auth";
import { makeExaminationKey } from "@/lib/exam-results/import-parser";
import {
  numericWorkbookValue,
  parseMultiSheetExamWorkbook,
  type WorkbookParseResult,
} from "@/lib/exam-results/workbook-parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_EXAM_NAME_LENGTH = 100;

function getText(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function resultStatus(value: string): "Pass" | "Fail" | "Needs Improvement" {
  const normalized = value.trim().toLowerCase();
  if (normalized === "fail") return "Fail";
  if (normalized === "needs improvement") return "Needs Improvement";
  return "Pass";
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Unauthorized. Sign in as an administrator." },
      { status: 401 },
    );
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const requestBytes = Number(contentLength);
    if (!Number.isSafeInteger(requestBytes) || requestBytes <= 0 || requestBytes > MAX_FILE_SIZE + 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "The upload request exceeds the 11 MB processing limit." },
        { status: 413 },
      );
    }
  }

  try {
    const formData = await request.formData();
    const academicYear = getText(formData.get("academicYear"));
    const className = getText(formData.get("className"));
    const examinationName = getText(formData.get("examinationName"));
    const publish = getText(formData.get("publish")).toLowerCase() === "true";
    const file = formData.get("file");

    if (academicYear && !/^\d{4}-\d{2}$/.test(academicYear)) {
      return NextResponse.json(
        { success: false, message: "Choose an academic year in YYYY-YY format." },
        { status: 400 },
      );
    }
    if (className.length > 100) {
      return NextResponse.json({ success: false, message: "Class name is too long." }, { status: 400 });
    }
    if (examinationName.length > MAX_EXAM_NAME_LENGTH) {
      return NextResponse.json(
        { success: false, message: `Examination name must be at most ${MAX_EXAM_NAME_LENGTH} characters.` },
        { status: 400 },
      );
    }
    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "Select an Excel (.xlsx or .xls) or CSV (.csv) file." },
        { status: 400 },
      );
    }
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "The file must be between 1 byte and 10 MB." },
        { status: 400 },
      );
    }

    let parsed: WorkbookParseResult;
    try {
      parsed = parseMultiSheetExamWorkbook(Buffer.from(await file.arrayBuffer()), file.name, {
        academicYear,
        className,
        examinationName,
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: error instanceof Error ? error.message : "The workbook is invalid.",
        },
        { status: 400 },
      );
    }
    if (parsed.errors.length > 0 || parsed.students.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Import cancelled. Fix the workbook validation issues and upload it again.",
          errorCount: parsed.errors.length,
          errors: parsed.errors.slice(0, 100),
          moreErrors: Math.max(0, parsed.errors.length - 100),
          validStudentCount: parsed.students.length,
          worksheets: parsed.worksheets,
          duplicates: parsed.duplicates,
          missingData: parsed.missingData,
        },
        { status: 422 },
      );
    }

    const students = parsed.students.map((student) => {
      const examinationKey = makeExaminationKey(student.examinationName);
      const totalMarks = numericWorkbookValue(student.totalMarks);
      const maximumMarks = numericWorkbookValue(student.maximumMarks);
      const percentage = numericWorkbookValue(student.percentage);
      const subjects = student.subjects.map((subject) => ({
        subject: subject.subject,
        maxMarks: numericWorkbookValue(subject.maxMarks),
        marksObtained: numericWorkbookValue(subject.marksObtained),
        grade: subject.grade,
        remarks: subject.remarks,
        resultStatus: "Pass" as const,
      }));
      if (
        !examinationKey ||
        totalMarks === null ||
        maximumMarks === null ||
        percentage === null ||
        subjects.length === 0 ||
        subjects.some((subject) => subject.maxMarks === null || subject.marksObtained === null)
      ) {
        return null;
      }
      return {
        ...student,
        examinationKey,
        totalMarks,
        maximumMarks,
        percentage,
        subjects,
        resultStatus: resultStatus(student.resultStatus),
      };
    });
    const validStudents = students.filter(
      (student): student is NonNullable<typeof student> => student !== null,
    );
    if (validStudents.length !== parsed.students.length) {
      return NextResponse.json(
        { success: false, message: "Import cancelled because one or more extracted records are incomplete." },
        { status: 422 },
      );
    }

    const transaction = await db.connect();
    try {
      await transaction.query("begin");
      for (const student of validStudents) {
        await transaction.query(
          `insert into school_exam_results (academic_year,class_name,examination_key,examination_name,serial_number,examination_date,roll_number,student_name,subjects,total_marks,maximum_marks,percentage,automatic_grade,manual_grade,final_grade,result_status,published,published_at,created_by) values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13,'',$13,$14,$15,$16,$17) on conflict (academic_year,class_name,examination_key,roll_number) do update set examination_name=excluded.examination_name,serial_number=excluded.serial_number,examination_date=excluded.examination_date,student_name=excluded.student_name,subjects=excluded.subjects,total_marks=excluded.total_marks,maximum_marks=excluded.maximum_marks,percentage=excluded.percentage,automatic_grade=excluded.automatic_grade,manual_grade=excluded.manual_grade,final_grade=excluded.final_grade,result_status=excluded.result_status,published=excluded.published,published_at=excluded.published_at,updated_at=now()`,
          [
            student.academicYear,
            student.className,
            student.examinationKey,
            student.examinationName,
            student.serialNumber,
            student.examinationDate,
            student.rollNumber,
            student.studentName,
            JSON.stringify(student.subjects),
            student.totalMarks,
            student.maximumMarks,
            student.percentage,
            student.grade,
            student.resultStatus,
            publish,
            publish ? new Date() : null,
            admin.id,
          ],
        );
      }
      await transaction.query("commit");

      const classNames = [...new Set(validStudents.map((student) => student.className))];
      const years = [...new Set(validStudents.map((student) => student.academicYear))];
      const examinationNames = [...new Set(validStudents.map((student) => student.examinationName))];
      return NextResponse.json({
        success: true,
        message: publish
          ? "Results imported and published successfully."
          : "Results imported as drafts. Students cannot see them yet.",
        importedCount: validStudents.length,
        published: publish,
        academicYear: years.length === 1 ? years[0] : "Multiple sessions",
        className: classNames.length === 1 ? classNames[0] : "Multiple classes",
        classNames,
        examinationName: examinationNames.length === 1 ? examinationNames[0] : "Multiple examinations",
        examinationKey: examinationNames.length === 1 ? makeExaminationKey(examinationNames[0]) : "",
      });
    } catch (error) {
      await transaction.query("rollback");
      throw error;
    } finally {
      transaction.release();
    }
  } catch (error) {
    console.error("Exam results import error:", error);
    return NextResponse.json(
      { success: false, message: "Import failed. Check the server logs." },
      { status: 500 },
    );
  }
}
