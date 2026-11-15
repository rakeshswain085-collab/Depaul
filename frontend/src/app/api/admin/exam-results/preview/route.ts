import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";
import { getCurrentAdmin } from "@/lib/auth";
import {
  numericWorkbookValue,
  isNoMarkValue,
  parseMultiSheetExamWorkbook,
  type WorkbookParseResult,
  type WorkbookStudent,
} from "@/lib/exam-results/workbook-parser";
import { makeExaminationKey } from "@/lib/exam-results/import-parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_EXAM_NAME_LENGTH = 100;

function getDatabaseSetupError(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return null;
  }
  const databaseError = error as { code?: unknown; message?: unknown };
  const code = databaseError.code;
  const message =
    typeof databaseError.message === "string" ? databaseError.message : "";

  if (code === "42P01" && message.includes("exam_result_imports")) {
    return "The exam-results database migration is missing. Apply backend/supabase/migrations/005_exam_result_import_history.sql, then retry the upload.";
  }
  if (
    code === "42703" &&
    /school_exam_results\.(?:serial_number|examination_date|import_id)/i.test(message)
  ) {
    return "The exam-results database migrations are incomplete. Apply migrations 004_exam_result_workbook_metadata.sql and 005_exam_result_import_history.sql, then retry the upload.";
  }
  return null;
}

type DraftStudent = {
  worksheet: string;
  academicYear: string;
  className: string;
  examinationKey: string;
  examinationName: string;
  examinationDate: string | null;
  serialNumber: string;
  rollNumber: string;
  studentName: string;
  subjects: Array<{
    subject: string;
    maxMarks: number;
    marksObtained: number | string;
    grade: string;
    remarks: string;
    resultStatus: "Pass" | "Fail";
  }>;
  totalMarks: number;
  maximumMarks: number;
  percentage: number;
  automaticGrade: string;
  manualGrade: string;
  finalGrade: string;
  resultStatus: "Pass" | "Fail" | "Needs Improvement";
  published: false;
  publishedAt: null;
  createdBy: string;
};

function getText(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function toDraftStudent(student: WorkbookStudent, adminId: string): DraftStudent | null {
  if (student.errors.length > 0) return null;
  const examinationKey = makeExaminationKey(student.examinationName);
  const totalMarks = numericWorkbookValue(student.totalMarks);
  const maximumMarks = numericWorkbookValue(student.maximumMarks);
  const percentage = numericWorkbookValue(student.percentage);
  const rollNumber = student.rollNumber || student.serialNumber;
  const subjects: DraftStudent["subjects"] = [];
  for (const subject of student.subjects) {
    const maxMarks = numericWorkbookValue(subject.maxMarks);
    const numericMarksObtained = numericWorkbookValue(subject.marksObtained);
    if (!subject.subject.trim() || maxMarks === null) return null;
    if (numericMarksObtained === null && !isNoMarkValue(subject.marksObtained)) return null;
    const marksObtained =
      numericMarksObtained ?? (isNoMarkValue(subject.marksObtained) ? subject.marksObtained : null);
    if (marksObtained === null) return null;
    subjects.push({
      subject: subject.subject,
      maxMarks,
      marksObtained,
      grade: subject.grade,
      remarks: subject.remarks,
      resultStatus: "Pass",
    });
  }
  if (
    !student.className ||
    !student.academicYear ||
    !student.examinationName ||
    !examinationKey ||
    !rollNumber ||
    !student.studentName ||
    totalMarks === null ||
    maximumMarks === null ||
    percentage === null ||
    subjects.length === 0
  ) {
    return null;
  }

  const resultStatus =
    student.resultStatus.trim().toLowerCase() === "fail"
      ? "Fail"
      : student.resultStatus.trim().toLowerCase() === "needs improvement"
        ? "Needs Improvement"
        : "Pass";

  return {
    worksheet: student.worksheet,
    academicYear: student.academicYear,
    className: student.className,
    examinationKey,
    examinationName: student.examinationName,
    examinationDate: student.examinationDate,
    serialNumber: student.serialNumber,
    rollNumber,
    studentName: student.studentName,
    subjects,
    totalMarks,
    maximumMarks,
    percentage,
    automaticGrade: student.grade,
    manualGrade: "",
    finalGrade: student.grade,
    resultStatus,
    published: false,
    publishedAt: null,
    createdBy: adminId,
  };
}

function getFailedRecords(parsed: WorkbookParseResult): Array<Record<string, unknown>> {
  const records = [
    ...parsed.errors.map((message) => ({ type: "validation", message })),
    ...parsed.duplicates.map((duplicate) => ({ type: "duplicate", ...duplicate })),
  ];
  const maxRecords = 500;
  if (records.length <= maxRecords) return records;
  return [
    ...records.slice(0, maxRecords),
    {
      type: "truncated",
      message: `${records.length - maxRecords} additional validation issues are not shown in import history.`,
    },
  ];
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Sign in as an administrator." },
        { status: 401 },
      );
    }

    const contentLength = request.headers.get("content-length");
    if (contentLength) {
      const requestBytes = Number(contentLength);
      if (!Number.isSafeInteger(requestBytes) || requestBytes <= 0 || requestBytes > MAX_FILE_SIZE + 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: "The upload request exceeds the 11 MB processing limit." },
          { status: 413 },
        );
      }
    }

    const formData = await request.formData();
    const academicYear = getText(formData.get("academicYear"));
    const className = getText(formData.get("className"));
    const examinationName = getText(formData.get("examinationName"));
    const file = formData.get("file");

    if (academicYear && !/^\d{4}-\d{2}$/.test(academicYear)) {
      return NextResponse.json(
        { success: false, error: "Academic year must use the format YYYY-YY." },
        { status: 400 },
      );
    }
    if (className.length > 100) {
      return NextResponse.json({ success: false, error: "Class name is too long." }, { status: 400 });
    }
    if (examinationName.length > MAX_EXAM_NAME_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Examination name must be at most ${MAX_EXAM_NAME_LENGTH} characters.` },
        { status: 400 },
      );
    }
    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Choose an .xlsx, .xls, or .csv file." },
        { status: 400 },
      );
    }
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "The file must be between 1 byte and 10 MB." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let parsed: WorkbookParseResult;
    try {
      parsed = parseMultiSheetExamWorkbook(buffer, file.name, {
        academicYear,
        className,
        examinationName,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "The workbook is invalid.";
      const history = await query<{ id: string }>(
        `insert into exam_result_imports (file_name, status, failed_records, error_message, created_by, completed_at)
         values ($1, 'Failed', $2::jsonb, $3, $4, now()) returning id`,
        [file.name, JSON.stringify([{ type: "workbook", message }]), message, admin.id],
      );
      return NextResponse.json(
        {
          success: false,
          error: message,
          importId: history.rows[0].id,
        },
        { status: 400 },
      );
    }
    const draftStudents = parsed.students.map((student) => toDraftStudent(student, admin.id));
    const committableStudents = draftStudents.filter(
      (student): student is DraftStudent => student !== null,
    );
    const worksheetErrors = new Map<string, string[]>(
      parsed.worksheets.map((worksheet) => [worksheet.worksheet, []]),
    );
    let hasUnattributedBlockingError = false;
    for (const error of parsed.errors) {
      const worksheetName = parsed.worksheets
        .map((worksheet) => worksheet.worksheet)
        .sort((left, right) => right.length - left.length)
        .find((name) =>
          error.startsWith(`${name}!`) ||
          error.startsWith(`${name}:`) ||
          error.startsWith(`${name} row `),
        );
      if (!worksheetName) {
          hasUnattributedBlockingError = true;
        continue;
      }
        const cellRow = error.startsWith(`${worksheetName}!`)
          ? Number(error.slice(worksheetName.length + 1).match(/^[A-Z]+\$?(\d+):/)?.[1])
          : Number.NaN;
        const isStudentRowIssue =
          error.startsWith(`${worksheetName} row `) ||
          (Number.isInteger(cellRow) &&
            parsed.students.some(
              (student) =>
                student.worksheet === worksheetName && student.rowNumber === cellRow,
            ));
        if (!isStudentRowIssue) {
          worksheetErrors.get(worksheetName)?.push(error);
        }
    }
    const classNames = [...new Set(parsed.students.map((student) => student.className).filter(Boolean))];
    const detectedClassNames = [
      ...new Set(
        parsed.worksheets
          .map((worksheet) => worksheet.className)
          .filter((name): name is string => Boolean(name)),
      ),
    ];
    const eligibleClassNames = hasUnattributedBlockingError
      ? []
      : classNames.filter((name) => {
          const worksheets = parsed.worksheets.filter((worksheet) => worksheet.className === name);
          const committableClassStudents = committableStudents.filter((student) => student.className === name);
          return (
            worksheets.length > 0 &&
            worksheets.every((worksheet) =>
              worksheet.detected &&
              worksheet.studentCount > 0 &&
              committableClassStudents.some((student) => student.worksheet === worksheet.worksheet) &&
              (worksheetErrors.get(worksheet.worksheet)?.length ?? 0) === 0,
            ) &&
            committableClassStudents.length > 0
          );
        });
    const canCommit =
      parsed.students.length > 0 &&
      eligibleClassNames.length > 0;
    const years = [...new Set(parsed.students.map((student) => student.academicYear).filter(Boolean))];
    const examinationNames = [...new Set(parsed.students.map((student) => student.examinationName).filter(Boolean))];
    const summary = {
      importedStudentCount: parsed.students.length,
      existingStudentCount: 0,
      newStudentCount: parsed.students.length,
      matchingStudentCount: 0,
      removedStudentCount: 0,
      newRollNumbers: [] as string[],
      matchingRollNumbers: [] as string[],
      removedRollNumbers: [] as string[],
      examinationName: examinationNames.length === 1 ? examinationNames[0] : "Multiple examinations",
      academicYear: years.length === 1 ? years[0] : "Multiple sessions",
      className: classNames.length === 1 ? classNames[0] : classNames.length ? "Multiple classes" : "",
      classNames,
    };

    if (committableStudents.length > 0) {
      const eligibleStudents = committableStudents.filter((student) =>
        eligibleClassNames.includes(student.className),
      );
      const students = eligibleStudents;
      if (students.length === 0) {
        const history = await query<{ id: string }>(
          `insert into exam_result_imports (file_name, status, detected_classes, student_count, failed_records, error_message, created_by, completed_at)
           values ($1, 'Failed', $2::jsonb, $3, $4::jsonb, $5, $6, now()) returning id`,
          [
            file.name,
            JSON.stringify(detectedClassNames),
            parsed.students.length,
            JSON.stringify(getFailedRecords(parsed)),
            parsed.errors.length ? "No classes passed validation." : "No importable student records were found.",
            admin.id,
          ],
        );
        return NextResponse.json({
          success: true,
          canCommit: false,
          draftId: null,
          importId: history.rows[0].id,
          expiresAt: null,
          summary,
          worksheets: parsed.worksheets,
          students: parsed.students,
          warnings: parsed.warnings,
          errors: parsed.errors,
          duplicates: parsed.duplicates,
          missingData: parsed.missingData,
          eligibleClassNames,
        });
      }
      const groups = new Map<string, { academicYear: string; className: string; examinationKey: string; rollNumbers: Set<string> }>();
      for (const student of students) {
        const key = JSON.stringify([student.academicYear, student.className, student.examinationKey]);
        const group = groups.get(key) ?? {
          academicYear: student.academicYear,
          className: student.className,
          examinationKey: student.examinationKey,
          rollNumbers: new Set<string>(),
        };
        group.rollNumbers.add(student.rollNumber.toLowerCase());
        groups.set(key, group);
      }

      const parameters: unknown[] = [];
      const tuples = [...groups.values()].map((group) => {
        const start = parameters.length;
        parameters.push(group.academicYear, group.className, group.examinationKey);
        return `($${start + 1}, $${start + 2}, $${start + 3})`;
      });
      const existingRows = await query<{
        academicYear: string;
        className: string;
        examinationKey: string;
        rollNumber: string;
      }>(
        `select academic_year as "academicYear", class_name as "className", examination_key as "examinationKey", roll_number as "rollNumber" from school_exam_results where (academic_year, class_name, examination_key) in (${tuples.join(", ")})`,
        parameters,
      );
      const existingByGroup = new Map<string, Set<string>>();
      for (const row of existingRows.rows) {
        const key = JSON.stringify([row.academicYear, row.className, row.examinationKey]);
        const existing = existingByGroup.get(key) ?? new Set<string>();
        existing.add(row.rollNumber.toLowerCase());
        existingByGroup.set(key, existing);
      }

      const importedByGroup = new Map(
        [...groups.entries()].map(([key, group]) => [key, group.rollNumbers]),
      );
      const displayRoll = (classValue: string, roll: string) =>
        classNames.length > 1 ? `${classValue}: ${roll}` : roll;
      const existingRollNumbers = new Set<string>();
      const newRollNumbers = new Set<string>();
      const removedRollNumbers = new Set<string>();
      for (const [key, importedRolls] of importedByGroup) {
        const group = groups.get(key)!;
        const existingRolls = existingByGroup.get(key) ?? new Set<string>();
        for (const roll of importedRolls) {
          if (existingRolls.has(roll)) existingRollNumbers.add(displayRoll(group.className, roll));
          else newRollNumbers.add(displayRoll(group.className, roll));
        }
        for (const roll of existingRolls) {
          if (!importedRolls.has(roll)) removedRollNumbers.add(displayRoll(group.className, roll));
        }
      }
      summary.existingStudentCount = existingRows.rows.length;
      summary.newStudentCount = newRollNumbers.size;
      summary.matchingStudentCount = existingRollNumbers.size;
      summary.removedStudentCount = removedRollNumbers.size;
      summary.newRollNumbers = [...newRollNumbers];
      summary.matchingRollNumbers = [...existingRollNumbers];
      summary.removedRollNumbers = [...removedRollNumbers];

      const first = students[0];
      const draft = await query<{ id: string; expiresAt: string }>(
        `insert into exam_import_drafts (admin_id, academic_year, class_name, examination_key, examination_name, students, existing_roll_numbers, removed_roll_numbers, expires_at) values ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb,now() + interval '24 hours') returning id, expires_at as "expiresAt"`,
        [
          admin.id,
          first.academicYear,
          classNames.length === 1 ? first.className : "__multi_sheet__",
          first.examinationKey,
          first.examinationName,
          JSON.stringify({
            version: 2,
            eligibleClassNames,
            students,
          }),
          JSON.stringify([...existingRollNumbers]),
          JSON.stringify([...removedRollNumbers]),
        ],
      );
      const history = await query<{ id: string }>(
        `insert into exam_result_imports (draft_id, file_name, status, detected_classes, student_count, failed_records, created_by)
         values ($1, $2, 'Ready to Publish', $3::jsonb, $4, $5::jsonb, $6) returning id`,
        [
          draft.rows[0].id,
          file.name,
          JSON.stringify(detectedClassNames),
          students.length,
          JSON.stringify(getFailedRecords(parsed)),
          admin.id,
        ],
      );

      return NextResponse.json({
        success: true,
        canCommit: true,
        draftId: draft.rows[0].id,
        importId: history.rows[0].id,
        expiresAt: draft.rows[0].expiresAt,
        summary,
        worksheets: parsed.worksheets,
        students: parsed.students,
        warnings: parsed.warnings,
        errors: parsed.errors,
        duplicates: parsed.duplicates,
        missingData: parsed.missingData,
        eligibleClassNames,
      });
    }

    const history = await query<{ id: string }>(
      `insert into exam_result_imports (file_name, status, detected_classes, student_count, failed_records, error_message, created_by, completed_at)
       values ($1, 'Failed', $2::jsonb, $3, $4::jsonb, $5, $6, now()) returning id`,
      [
        file.name,
        JSON.stringify(detectedClassNames),
        parsed.students.length,
        JSON.stringify(getFailedRecords(parsed)),
        parsed.errors.length ? "No classes passed validation." : "No importable student records were found.",
        admin.id,
      ],
    );
    return NextResponse.json({
      success: true,
      canCommit: false,
      draftId: null,
      importId: history.rows[0].id,
      expiresAt: null,
      summary,
      worksheets: parsed.worksheets,
      students: parsed.students,
      warnings: parsed.warnings,
      errors: parsed.errors,
      duplicates: parsed.duplicates,
      missingData: parsed.missingData,
      eligibleClassNames,
    });
  } catch (error) {
    console.error("Exam result preview error:", error);
    const setupError = getDatabaseSetupError(error);
    return NextResponse.json(
      {
        success: false,
        error: setupError ?? "Unable to preview the uploaded workbook.",
      },
      { status: setupError ? 503 : 500 },
    );
  }
}
