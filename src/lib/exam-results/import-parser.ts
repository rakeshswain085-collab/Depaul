
import * as XLSX from "xlsx";

export type ParsedStudent = {
  academicYear: string;
  className: string;
  examinationKey: string;
  examinationName: string;
  rollNumber: string;
  studentName: string;
  subjects: {
    subject: string;
    maxMarks: number;
    marksObtained: number;
    grade: string;
    remarks: string;
    resultStatus: "Pass" | "Fail";
  }[];
  totalMarks: number;
  maximumMarks: number;
  percentage: number;
  automaticGrade: string;
  manualGrade: string;
  finalGrade: string;
  resultStatus: "Pass" | "Fail" | "Needs Improvement";
  published: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
};

function gradeForPercentage(percentage: number): string {
  if (percentage >= 90) return "A1";
  if (percentage >= 80) return "A2";
  if (percentage >= 70) return "B1";
  if (percentage >= 60) return "B2";
  if (percentage >= 50) return "C1";
  if (percentage >= 40) return "C2";
  if (percentage >= 33) return "D";
  return "E";
}

function normalizeHeader(value: unknown): string {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function makeExaminationKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseExamWorkbook(
  buffer: Buffer,
  metadata: {
    academicYear: string;
    className: string;
    examinationName: string;
    createdBy: string;
  }
): { students: ParsedStudent[]; errors: string[] } {
  const errors: string[] = [];
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheet = workbook.SheetNames[0];

  if (!firstSheet) {
    return { students: [], errors: ["The workbook contains no worksheet."] };
  }

  const sheet = workbook.Sheets[firstSheet];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  if (!rows.length) {
    return { students: [], errors: ["The worksheet has no student rows."] };
  }

  const originalHeaders = Object.keys(rows[0]);
  const headerMap = new Map(
    originalHeaders.map((header) => [normalizeHeader(header), header])
  );

  const get = (row: Record<string, unknown>, name: string) => {
    const original = headerMap.get(normalizeHeader(name));
    return original ? row[original] : undefined;
  };

  for (const required of ["Roll Number", "Student Name"]) {
    if (!headerMap.has(normalizeHeader(required))) {
      errors.push(`Missing required column: "${required}".`);
    }
  }

  const subjectIndexes = new Set<number>();

  for (const header of originalHeaders) {
    const match = header.match(/^subject\s+(\d+)\s+name$/i);
    if (match) subjectIndexes.add(Number(match[1]));
  }

  if (subjectIndexes.size === 0) {
    errors.push('No subject columns found. Add "Subject 1 Name" and its marks columns.');
  }

  if (errors.length) return { students: [], errors };

  const examinationKey = makeExaminationKey(metadata.examinationName);
  const seenRollNumbers = new Set<string>();
  const students: ParsedStudent[] = [];
  const now = new Date();

  rows.forEach((row, rowIndex) => {
    const line = rowIndex + 2;
    const rollNumber = String(get(row, "Roll Number") ?? "").trim();
    const studentName = String(get(row, "Student Name") ?? "").trim();

    if (!rollNumber || !studentName) {
      errors.push(`Row ${line}: Roll Number and Student Name are required.`);
      return;
    }

    const normalizedRoll = rollNumber.toLowerCase();
    if (seenRollNumbers.has(normalizedRoll)) {
      errors.push(`Row ${line}: Duplicate roll number "${rollNumber}".`);
      return;
    }
    seenRollNumbers.add(normalizedRoll);

    const subjects: ParsedStudent["subjects"] = [];

    for (const index of [...subjectIndexes].sort((a, b) => a - b)) {
      const subject = String(get(row, `Subject ${index} Name`) ?? "").trim();
      const maxRaw = String(
        get(row, `Subject ${index} Maximum Marks`) ?? ""
      ).trim();
      const marksRaw = String(
        get(row, `Subject ${index} Marks Obtained`) ?? ""
      ).trim();

      if (!subject && !maxRaw && !marksRaw) continue;

      const maxMarks = Number(maxRaw);
      const marksObtained = Number(marksRaw);

      if (!subject || maxRaw === "" || marksRaw === "") {
        errors.push(`Row ${line}: Subject ${index} needs a name, maximum marks, and marks obtained.`);
        continue;
      }

      if (
        !Number.isFinite(maxMarks) ||
        !Number.isFinite(marksObtained) ||
        maxMarks <= 0 ||
        marksObtained < 0 ||
        marksObtained > maxMarks
      ) {
        errors.push(`Row ${line}: Invalid marks for "${subject}". Marks must be between 0 and maximum marks.`);
        continue;
      }

      const percentage = (marksObtained / maxMarks) * 100;
      const passed = percentage >= 33;

      subjects.push({
        subject,
        maxMarks,
        marksObtained,
        grade: gradeForPercentage(percentage),
        remarks: passed ? "" : "Below passing marks",
        resultStatus: passed ? "Pass" : "Fail",
      });
    }

    if (!subjects.length) {
      errors.push(`Row ${line}: At least one valid subject is required.`);
      return;
    }

    const totalMarks = subjects.reduce((sum, s) => sum + s.marksObtained, 0);
    const maximumMarks = subjects.reduce((sum, s) => sum + s.maxMarks, 0);
    const percentage = maximumMarks ? (totalMarks / maximumMarks) * 100 : 0;
    const failedSubject = subjects.some((s) => s.resultStatus === "Fail");
    const manualGrade = String(get(row, "Manual Grade (Optional)") ?? "").trim();
    const automaticGrade = gradeForPercentage(percentage);

    students.push({
      academicYear: metadata.academicYear,
      className: metadata.className,
      examinationKey,
      examinationName: metadata.examinationName.trim(),
      rollNumber,
      studentName,
      subjects,
      totalMarks,
      maximumMarks,
      percentage: Number(percentage.toFixed(2)),
      automaticGrade,
      manualGrade,
      finalGrade: manualGrade || automaticGrade,
      resultStatus: failedSubject
        ? "Fail"
        : percentage < 40
          ? "Needs Improvement"
          : "Pass",
      published: false,
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
      createdBy: metadata.createdBy,
    });
  });

  return { students, errors };
}
