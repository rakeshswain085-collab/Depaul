
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { connectDB } from "../../../../../../database/mongodb";
import { getCurrentAdmin } from "@/lib/auth";
import SchoolExamResult from "@/lib/models/SchoolExamResult";
import { isValidSchoolClass } from "@/lib/school-classes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SheetRow = Record<string, unknown>;

type Subject = {
  subject: string;
  maxMarks: number;
  marksObtained: number;
  grade: string;
  remarks: string;
  resultStatus: "Pass" | "Fail";
};

type Student = {
  rollNumber: string;
  studentName: string;
  subjects: Subject[];
  manualGrade: string;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_STUDENTS = 5000;
const MAX_SUBJECTS = 6;
const PASS_PERCENTAGE = 33;

const ALLOWED_GRADES = ["A+", "A", "B+", "B", "C", "D", "F"];

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function getCell(row: SheetRow, header: string): unknown {
  const wanted = normalizeHeader(header);
  const key = Object.keys(row).find(
    (candidate) => normalizeHeader(candidate) === wanted
  );

  return key === undefined ? undefined : row[key];
}

function toText(value: unknown): string {
  return String(value ?? "").trim();
}

function toNumber(value: unknown): number {
  if (value === "" || value === null || value === undefined) {
    return NaN;
  }

  if (typeof value === "string" && value.trim() === "") {
    return NaN;
  }

  return Number(value);
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || String(value).trim() === "";
}

function makeExaminationKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function calculateGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= PASS_PERCENTAGE) return "D";
  return "F";
}

function getSubjectHeaders(subjectNumber: number) {
  return {
    name: `Subject ${subjectNumber} Name`,
    maximum: `Subject ${subjectNumber} Maximum Marks`,
    obtained: `Subject ${subjectNumber} Marks Obtained`,
  };
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Unauthorized. Please sign in as an administrator." },
      { status: 401 }
    );
  }

  try {
    const form = await request.formData();

    const academicYear = toText(form.get("academicYear"));
    const className = toText(form.get("className"));
    const examinationName = toText(form.get("examinationName"));
    const publish = toText(form.get("publish")).toLowerCase() === "true";
    const file = form.get("file");

    if (!/^\d{4}-\d{2}$/.test(academicYear)) {
      return NextResponse.json(
        { success: false, message: "Choose a valid academic year, e.g. 2026-27." },
        { status: 400 }
      );
    }

    if (!isValidSchoolClass(className)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid class. Choose Pre-Nursery, Nursery, LKG, UKG, or Class 1 through Class 12.",
        },
        { status: 400 }
      );
    }

    if (!examinationName || examinationName.length > 100) {
      return NextResponse.json(
        { success: false, message: "Enter an examination name up to 100 characters." },
        { status: 400 }
      );
    }

    const examinationKey = makeExaminationKey(examinationName);

    if (!examinationKey) {
      return NextResponse.json(
        { success: false, message: "The examination name is invalid." },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "Select an Excel (.xlsx) or CSV (.csv) file." },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "The file must be between 1 byte and 5 MB." },
        { status: 400 }
      );
    }

    const filename = file.name.toLowerCase();

    if (!filename.endsWith(".xlsx") && !filename.endsWith(".csv")) {
      return NextResponse.json(
        { success: false, message: "Only .xlsx and .csv files are supported." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      return NextResponse.json(
        { success: false, message: "The file contains no worksheet." },
        { status: 400 }
      );
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<SheetRow>(worksheet, {
      defval: "",
      raw: true,
    });

    const nonEmptyRows = rows.filter((row) =>
      Object.values(row).some((value) => !isBlank(value))
    );

    if (nonEmptyRows.length === 0) {
      return NextResponse.json(
        { success: false, message: "No student data was found." },
        { status: 400 }
      );
    }

    if (nonEmptyRows.length > MAX_STUDENTS) {
      return NextResponse.json(
        { success: false, message: `Maximum ${MAX_STUDENTS} student rows allowed.` },
        { status: 400 }
      );
    }

    const headers = Object.keys(nonEmptyRows[0]).map(normalizeHeader);
    const missingHeaders = ["roll number", "student name"].filter(
      (header) => !headers.includes(header)
    );

    if (missingHeaders.length) {
      return NextResponse.json(
        {
          success: false,
          message: `Missing required columns: ${missingHeaders.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    const students = new Map<string, Student>();
    const errors: string[] = [];

    nonEmptyRows.forEach((row: SheetRow, index: number) => {
      const rowNumber = index + 2;
      const rollNumber = toText(getCell(row, "Roll Number"));
      const studentName = toText(getCell(row, "Student Name"));

      if (!rollNumber || !studentName) {
        errors.push(`Row ${rowNumber}: Roll Number and Student Name are required.`);
        return;
      }

      if (rollNumber.length > 50 || studentName.length > 150) {
        errors.push(`Row ${rowNumber}: Roll number or student name is too long.`);
        return;
      }

      const rollKey = rollNumber.toLowerCase();

      if (students.has(rollKey)) {
        errors.push(`Row ${rowNumber}: duplicate roll number "${rollNumber}".`);
        return;
      }

      const subjects: Subject[] = [];
      let invalidSubject = false;

      for (let number = 1; number <= MAX_SUBJECTS; number++) {
        const columns = getSubjectHeaders(number);
        const nameValue = getCell(row, columns.name);
        const maxValue = getCell(row, columns.maximum);
        const obtainedValue = getCell(row, columns.obtained);

        const allBlank =
          isBlank(nameValue) && isBlank(maxValue) && isBlank(obtainedValue);

        if (allBlank) continue;

        const subjectName = toText(nameValue);
        const maxMarks = toNumber(maxValue);
        const marksObtained = toNumber(obtainedValue);

        if (
          !subjectName ||
          isBlank(maxValue) ||
          isBlank(obtainedValue) ||
          subjectName.length > 100 ||
          !Number.isFinite(maxMarks) ||
          !Number.isFinite(marksObtained) ||
          maxMarks <= 0 ||
          marksObtained < 0 ||
          marksObtained > maxMarks
        ) {
          errors.push(
            `Row ${rowNumber}, Subject ${number}: provide a subject name, positive maximum marks, and marks obtained between 0 and the maximum.`
          );
          invalidSubject = true;
          continue;
        }

        const subjectPercentage = (marksObtained / maxMarks) * 100;
        const resultStatus: "Pass" | "Fail" =
          subjectPercentage < PASS_PERCENTAGE ? "Fail" : "Pass";

        subjects.push({
          subject: subjectName,
          maxMarks,
          marksObtained,
          grade: calculateGrade(subjectPercentage),
          remarks: "",
          resultStatus,
        });
      }

      if (invalidSubject) return;

      if (!subjects.length) {
        errors.push(`Row ${rowNumber}: enter marks for at least one subject.`);
        return;
      }

      const manualGrade = toText(
        getCell(row, "Manual Grade (Optional)")
      ).toUpperCase();

      if (manualGrade && !ALLOWED_GRADES.includes(manualGrade)) {
        errors.push(
          `Row ${rowNumber}: manual grade must be ${ALLOWED_GRADES.join(", ")} or blank.`
        );
        return;
      }

      students.set(rollKey, {
        rollNumber,
        studentName,
        subjects,
        manualGrade,
      });
    });

    if (errors.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Import cancelled. Fix the following Excel errors and upload again.",
          errorCount: errors.length,
          errors: errors.slice(0, 100),
          moreErrors: Math.max(0, errors.length - 100),
        },
        { status: 400 }
      );
    }

    if (!students.size) {
      return NextResponse.json(
        { success: false, message: "No valid student records found." },
        { status: 400 }
      );
    }

    const now = new Date();

    const documents = Array.from(students.values()).map((student) => {
      const totalMarks = student.subjects.reduce(
        (sum, subject) => sum + subject.marksObtained,
        0
      );
      const maximumMarks = student.subjects.reduce(
        (sum, subject) => sum + subject.maxMarks,
        0
      );
      const percentage =
        maximumMarks > 0
          ? Number(((totalMarks / maximumMarks) * 100).toFixed(2))
          : 0;

      const automaticGrade = calculateGrade(percentage);
      const finalGrade = student.manualGrade || automaticGrade;
      const failedSubject = student.subjects.some(
        (subject) => subject.resultStatus === "Fail"
      );

      return {
        academicYear,
        className,
        examinationKey,
        examinationName,
        rollNumber: student.rollNumber,
        studentName: student.studentName,
        subjects: student.subjects,
        totalMarks,
        maximumMarks,
        percentage,
        automaticGrade,
        manualGrade: student.manualGrade,
        finalGrade,
        resultStatus: failedSubject ? "Fail" : "Pass",
        published: publish,
        publishedAt: publish ? now : null,
        updatedAt: now,
        createdBy: admin.id,
      };
    });

    await connectDB();

    const operations = documents.map((document) => ({
      updateOne: {
        filter: {
          academicYear: document.academicYear,
          className: document.className,
          examinationKey: document.examinationKey,
          rollNumber: document.rollNumber,
        },
        update: {
          $set: document,
          $setOnInsert: { createdAt: now },
        },
        upsert: true,
      },
    }));

    await SchoolExamResult.bulkWrite(operations, { ordered: true });

    return NextResponse.json({
      success: true,
      message: publish
        ? "Results imported and published successfully."
        : "Results imported as drafts. Students cannot see them yet.",
      importedCount: documents.length,
      published: publish,
      academicYear,
      className,
      examinationName,
      examinationKey,
    });
  } catch (error) {
    console.error("Exam results import error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Import failed. Check the development terminal for details.",
      },
      { status: 500 }
    );
  }
}
