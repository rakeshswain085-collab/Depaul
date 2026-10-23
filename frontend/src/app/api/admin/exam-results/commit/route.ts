
import { NextRequest, NextResponse } from "next/server";
import { db, query } from "@/lib/database";
import { getCurrentAdmin } from "@/lib/auth";

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

    if (!draftId) {
      return NextResponse.json({ error: "Invalid draft ID." }, { status: 400 });
    }

    if (mode !== "update" && mode !== "replace") {
      return NextResponse.json(
        { error: 'Mode must be "update" or "replace".' },
        { status: 400 }
      );
    }

    const draftResult = await query<any>("select * from exam_import_drafts where id=$1 and admin_id=$2 and expires_at > now()", [draftId, adminId]);
    const draft = draftResult.rows[0];

    if (!draft) {
      return NextResponse.json(
        { error: "Draft not found or expired. Upload the file again." },
        { status: 404 }
      );
    }

    if (!Array.isArray(draft.students) || draft.students.length === 0) {
      return NextResponse.json({ error: "The draft contains no students." }, { status: 422 });
    }

    const academicYear = draft.academic_year, className = draft.class_name, examinationKey = draft.examination_key, examinationName = draft.examination_name, students = draft.students;

    // First write the validated students. Keep the examination unpublished.
    const transaction = await db.connect();
    try {
      await transaction.query("begin");
      for (const student of students) await transaction.query(
        `insert into school_exam_results (academic_year,class_name,examination_key,examination_name,roll_number,student_name,subjects,total_marks,maximum_marks,percentage,automatic_grade,manual_grade,final_grade,result_status,published,published_at,created_by) values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13,$14,false,null,$15) on conflict (academic_year,class_name,examination_key,roll_number) do update set examination_name=excluded.examination_name,student_name=excluded.student_name,subjects=excluded.subjects,total_marks=excluded.total_marks,maximum_marks=excluded.maximum_marks,percentage=excluded.percentage,automatic_grade=excluded.automatic_grade,manual_grade=excluded.manual_grade,final_grade=excluded.final_grade,result_status=excluded.result_status,published=false,published_at=null,updated_at=now()`,
        [academicYear,className,examinationKey,examinationName,student.rollNumber,student.studentName,JSON.stringify(student.subjects || []),student.totalMarks,student.maximumMarks,student.percentage,student.automaticGrade || "",student.manualGrade || "",student.finalGrade || "",student.resultStatus,student.createdBy || adminId]);

    // Replacement is explicit and only removes students not present in the draft.
    if (mode === "replace") {
      const importedRollNumbers = students.map((student: any) => student.rollNumber);

      await transaction.query("delete from school_exam_results where academic_year=$1 and class_name=$2 and examination_key=$3 and not (roll_number = any($4))", [academicYear,className,examinationKey,importedRollNumbers]);
    }

    // Ensure every record in this examination is unpublished after changes.
      await transaction.query("update school_exam_results set published=false, published_at=null, updated_at=now() where academic_year=$1 and class_name=$2 and examination_key=$3", [academicYear,className,examinationKey]);
      await transaction.query("delete from exam_import_drafts where id=$1 and admin_id=$2", [draftId,adminId]);
      const count = await transaction.query<{ count: string }>("select count(*) from school_exam_results where academic_year=$1 and class_name=$2 and examination_key=$3", [academicYear,className,examinationKey]);
      await transaction.query("commit");
      const studentCount = Number(count.rows[0].count);

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
    } catch (error) { await transaction.query("rollback"); throw error; } finally { transaction.release(); }
  } catch (error) {
    console.error("Exam result commit error:", error);
    return NextResponse.json(
      { error: "Unable to commit examination records. Check the server logs." },
      { status: 500 }
    );
  }
}
