
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "../../../../../../database/mongodb";
import { getCurrentAdmin } from "@/lib/auth";
import SchoolExamResult from "@/lib/models/SchoolExamResult";
import ExamImportDraft from "@/lib/models/ExamImportDraft";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminId = String((admin as any)._id ?? (admin as any).id ?? "");
    const body = await request.json();
    const draftId = String(body.draftId ?? "").trim();
    const mode = String(body.mode ?? "");

    if (!mongoose.isValidObjectId(draftId)) {
      return NextResponse.json({ error: "Invalid draft ID." }, { status: 400 });
    }

    if (mode !== "update" && mode !== "replace") {
      return NextResponse.json(
        { error: 'Mode must be "update" or "replace".' },
        { status: 400 }
      );
    }

    await connectDB();

    const draft = await ExamImportDraft.findOne({
      _id: draftId,
      adminId,
      expiresAt: { $gt: new Date() },
    }).lean() as any;

    if (!draft) {
      return NextResponse.json(
        { error: "Draft not found or expired. Upload the file again." },
        { status: 404 }
      );
    }

    if (!Array.isArray(draft.students) || draft.students.length === 0) {
      return NextResponse.json({ error: "The draft contains no students." }, { status: 422 });
    }

    const {
      academicYear,
      className,
      examinationKey,
      examinationName,
      students,
    } = draft;

    // First write the validated students. Keep the examination unpublished.
    const operations = students.map((student: any) => ({
      updateOne: {
        filter: {
          academicYear,
          className,
          examinationKey,
          rollNumber: student.rollNumber,
        },
        update: {
          $set: {
            ...student,
            examinationName,
            published: false,
            publishedAt: null,
            updatedAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    await SchoolExamResult.bulkWrite(operations, { ordered: true });

    // Replacement is explicit and only removes students not present in the draft.
    if (mode === "replace") {
      const importedRollNumbers = students.map((student: any) => student.rollNumber);

      await SchoolExamResult.deleteMany({
        academicYear,
        className,
        examinationKey,
        rollNumber: { $nin: importedRollNumbers },
      });
    }

    // Ensure every record in this examination is unpublished after changes.
    await SchoolExamResult.updateMany(
      { academicYear, className, examinationKey },
      { $set: { published: false, publishedAt: null, updatedAt: new Date() } }
    );

    await ExamImportDraft.deleteOne({ _id: draft._id, adminId });

    const studentCount = await SchoolExamResult.countDocuments({
      academicYear,
      className,
      examinationKey,
    });

    return NextResponse.json({
      success: true,
      message:
        mode === "replace"
          ? "Examination records replaced successfully. Review and publish the results when ready."
          : "Examination records updated successfully. Review and publish the results when ready.",
      mode,
      studentCount,
      published: false,
    });
  } catch (error) {
    console.error("Exam result commit error:", error);
    return NextResponse.json(
      { error: "Unable to commit examination records. Check the server logs." },
      { status: 500 }
    );
  }
}
