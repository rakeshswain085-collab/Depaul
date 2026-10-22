
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../../database/mongodb";
import { getCurrentAdmin } from "@/lib/auth";
import SchoolExamResult from "@/lib/models/SchoolExamResult";
import ExamImportDraft from "@/lib/models/ExamImportDraft";
import { isValidSchoolClass } from "@/lib/school-classes";
import {
  makeExaminationKey,
  parseExamWorkbook,
} from "@/lib/exam-results/import-parser";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const academicYear = String(formData.get("academicYear") ?? "").trim();
    const className = String(formData.get("className") ?? "").trim();
    const examinationName = String(formData.get("examinationName") ?? "").trim();
    const file = formData.get("file");

    if (!/^\d{4}-\d{2}$/.test(academicYear)) {
      return NextResponse.json(
        { error: "Academic year must use the format YYYY-YY, for example 2026-27." },
        { status: 400 }
      );
    }

    if (!isValidSchoolClass(className)) {
      return NextResponse.json({ error: "Invalid class." }, { status: 400 });
    }

    if (!examinationName || examinationName.length > 100) {
      return NextResponse.json(
        { error: "Examination name is required and must be at most 100 characters." },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please upload an Excel or CSV file." }, { status: 400 });
    }

    if (!/\.(xlsx|csv)$/i.test(file.name)) {
      return NextResponse.json(
        { error: "Only .xlsx and .csv files are supported." },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "The file must be between 1 byte and 5 MB." },
        { status: 400 }
      );
    }

    await connectDB();

    const adminId = String((admin as any)._id ?? (admin as any).id ?? "");
    if (!adminId) {
      return NextResponse.json(
        { error: "Unable to identify the authenticated admin." },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = parseExamWorkbook(buffer, {
      academicYear,
      className,
      examinationName,
      createdBy: adminId,
    });

    if (parsed.errors.length > 0) {
      return NextResponse.json(
        {
          error: "The file contains validation errors.",
          errors: parsed.errors,
          validStudentCount: parsed.students.length,
        },
        { status: 422 }
      );
    }

    if (parsed.students.length === 0) {
      return NextResponse.json({ error: "No valid students were found." }, { status: 422 });
    }

    const examinationKey = makeExaminationKey(examinationName);

    const existing = await SchoolExamResult.find({
      academicYear,
      className,
      examinationKey,
    })
      .select("rollNumber")
      .lean();

    const existingRollNumbers = existing.map((item: any) => String(item.rollNumber));
    const importedRollNumbers = new Set(
      parsed.students.map((student) => student.rollNumber.toLowerCase())
    );

    const existingRollsLower = new Set(
      existingRollNumbers.map((roll) => roll.toLowerCase())
    );

    const newRollNumbers = parsed.students
      .filter((student) => !existingRollsLower.has(student.rollNumber.toLowerCase()))
      .map((student) => student.rollNumber);

    const matchingRollNumbers = parsed.students
      .filter((student) => existingRollsLower.has(student.rollNumber.toLowerCase()))
      .map((student) => student.rollNumber);

    const removedRollNumbers = existingRollNumbers.filter(
      (roll) => !importedRollNumbers.has(roll.toLowerCase())
    );

    const draft = await ExamImportDraft.create({
      adminId,
      academicYear,
      className,
      examinationKey,
      examinationName: examinationName.trim(),
      students: parsed.students,
      existingRollNumbers,
      removedRollNumbers,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    return NextResponse.json({
      success: true,
      draftId: String(draft._id),
      expiresAt: draft.expiresAt,
      summary: {
        importedStudentCount: parsed.students.length,
        existingStudentCount: existingRollNumbers.length,
        newStudentCount: newRollNumbers.length,
        matchingStudentCount: matchingRollNumbers.length,
        removedStudentCount: removedRollNumbers.length,
        newRollNumbers,
        matchingRollNumbers,
        removedRollNumbers,
        examinationName,
        academicYear,
        className,
      },
      students: parsed.students.map((student) => ({
        rollNumber: student.rollNumber,
        studentName: student.studentName,
        totalMarks: student.totalMarks,
        maximumMarks: student.maximumMarks,
        percentage: student.percentage,
        finalGrade: student.finalGrade,
        resultStatus: student.resultStatus,
      })),
    });
  } catch (error) {
    console.error("Exam result preview error:", error);
    return NextResponse.json(
      { error: "Unable to preview the uploaded file." },
      { status: 500 }
    );
  }
}
