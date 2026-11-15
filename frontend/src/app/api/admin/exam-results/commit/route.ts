import { NextRequest, NextResponse } from "next/server";
import { db, query } from "@/lib/database";
import { getCurrentAdmin } from "@/lib/auth";

export const runtime = "nodejs";

type DraftStudent = {
  academicYear: string;
  className: string;
  examinationKey: string;
  examinationName: string;
  examinationDate?: string | null;
  serialNumber?: string;
  rollNumber: string;
  studentName: string;
  subjects: Array<{
    subject: string;
    maxMarks: number;
    marksObtained: number | string;
    grade?: string;
    remarks?: string;
    resultStatus?: "Pass" | "Fail";
  }>;
  totalMarks: number;
  maximumMarks: number;
  percentage: number;
  automaticGrade?: string;
  manualGrade?: string;
  finalGrade?: string;
  resultStatus: "Pass" | "Fail" | "Needs Improvement";
  createdBy?: string;
};

type DraftRow = {
  id: string;
  academic_year: string;
  class_name: string;
  examination_key: string;
  examination_name: string;
  students: unknown;
  import_id: string | null;
  import_status: string | null;
};

type ResultGroup = {
  academicYear: string;
  className: string;
  examinationKey: string;
  students: DraftStudent[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNoMarkValue(value: unknown): value is string {
  return typeof value === "string" && /^[-\u2010-\u2015\u2212]$/.test(value.trim());
}

function parseDraftStudent(
  value: unknown,
  defaults: Pick<DraftRow, "academic_year" | "class_name" | "examination_key" | "examination_name">,
  adminId: string,
): DraftStudent | null {
  if (!isRecord(value) || !Array.isArray(value.subjects)) return null;
  const academicYear = typeof value.academicYear === "string" ? value.academicYear : defaults.academic_year;
  const className = typeof value.className === "string" ? value.className : defaults.class_name;
  const examinationName = typeof value.examinationName === "string" ? value.examinationName : defaults.examination_name;
  const examinationKey = typeof value.examinationKey === "string" ? value.examinationKey : defaults.examination_key;
  const rollNumber = typeof value.rollNumber === "string" ? value.rollNumber.trim() : "";
  const studentName = typeof value.studentName === "string" ? value.studentName.trim() : "";
  const resultStatus = value.resultStatus;
  if (
    !academicYear ||
    !className ||
    className.length > 100 ||
    !examinationName ||
    examinationName.length > 100 ||
    !examinationKey ||
    !rollNumber ||
    rollNumber.length > 50 ||
    !studentName ||
    studentName.length > 150 ||
    !isFiniteNumber(value.totalMarks) ||
    !isFiniteNumber(value.maximumMarks) ||
    !isFiniteNumber(value.percentage) ||
    !["Pass", "Fail", "Needs Improvement"].includes(String(resultStatus))
  ) {
    return null;
  }
  const subjects: DraftStudent["subjects"] = [];
  for (const rawSubject of value.subjects) {
    if (!isRecord(rawSubject)) return null;
    if (
      typeof rawSubject.subject !== "string" ||
      !rawSubject.subject.trim() ||
      !isFiniteNumber(rawSubject.maxMarks) ||
      (!isFiniteNumber(rawSubject.marksObtained) && !isNoMarkValue(rawSubject.marksObtained))
    ) {
      return null;
    }
    subjects.push({
      subject: rawSubject.subject.trim(),
      maxMarks: rawSubject.maxMarks,
      marksObtained: rawSubject.marksObtained,
      grade: typeof rawSubject.grade === "string" ? rawSubject.grade : "",
      remarks: typeof rawSubject.remarks === "string" ? rawSubject.remarks : "",
      resultStatus: rawSubject.resultStatus === "Fail" ? "Fail" : "Pass",
    });
  }
  if (subjects.length === 0) return null;

  return {
    academicYear,
    className,
    examinationKey,
    examinationName,
    examinationDate:
      typeof value.examinationDate === "string" ? value.examinationDate : null,
    serialNumber: typeof value.serialNumber === "string" ? value.serialNumber : "",
    rollNumber,
    studentName,
    subjects,
    totalMarks: value.totalMarks,
    maximumMarks: value.maximumMarks,
    percentage: value.percentage,
    automaticGrade: typeof value.automaticGrade === "string" ? value.automaticGrade : "",
    manualGrade: typeof value.manualGrade === "string" ? value.manualGrade : "",
    finalGrade: typeof value.finalGrade === "string" ? value.finalGrade : "",
    resultStatus: resultStatus as DraftStudent["resultStatus"],
    createdBy: typeof value.createdBy === "string" ? value.createdBy : adminId,
  };
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!isRecord(body)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const draftId = typeof body.draftId === "string" ? body.draftId.trim() : "";
  const mode = body.mode;
  const requestedClassNames = body.classNames;
  if (!/^[\da-f-]{36}$/i.test(draftId)) {
    return NextResponse.json({ error: "Invalid draft ID." }, { status: 400 });
  }
  if (mode !== "update" && mode !== "replace") {
    return NextResponse.json(
      { error: 'Mode must be "update" or "replace".' },
      { status: 400 },
    );
  }
  if (
    requestedClassNames !== undefined &&
    (!Array.isArray(requestedClassNames) ||
      requestedClassNames.length === 0 ||
      requestedClassNames.length > 100 ||
      requestedClassNames.some(
        (name) => typeof name !== "string" || !name.trim() || name.length > 100,
      ) ||
      new Set(requestedClassNames).size !== requestedClassNames.length)
  ) {
    return NextResponse.json({ error: "Select one or more valid classes." }, { status: 400 });
  }
  if (body.publish !== undefined && typeof body.publish !== "boolean") {
    return NextResponse.json({ error: "Publish must be a boolean value." }, { status: 400 });
  }
  const publish = body.publish === true;
  let importId: string | null = null;
  let validationStarted = false;

  try {
    const draftResult = await query<DraftRow>(
      `select d.id, d.academic_year, d.class_name, d.examination_key, d.examination_name, d.students,
              i.id as import_id, i.status as import_status
       from exam_import_drafts d
       left join exam_result_imports i on i.draft_id=d.id
       where d.id=$1 and d.admin_id=$2 and d.expires_at > now()`,
      [draftId, admin.id],
    );
    const draft = draftResult.rows[0];
    if (!draft) {
      return NextResponse.json(
        { error: "Draft not found or expired. Upload the file again." },
        { status: 404 },
      );
    }
    importId = draft.import_id;
    if (importId && draft.import_status !== "Ready to Publish") {
      return NextResponse.json(
        { error: `This import is ${draft.import_status?.toLowerCase() ?? "not ready"} and cannot be committed again.` },
        { status: 409 },
      );
    }
    let rawStudents: unknown[];
    let eligibleClassNames: string[] | null = null;
    if (Array.isArray(draft.students)) {
      rawStudents = draft.students;
    } else if (
      isRecord(draft.students) &&
      Array.isArray(draft.students.students) &&
      Array.isArray(draft.students.eligibleClassNames) &&
      draft.students.eligibleClassNames.every((name) => typeof name === "string")
    ) {
      rawStudents = draft.students.students;
      eligibleClassNames = draft.students.eligibleClassNames;
    } else {
      return NextResponse.json({ error: "The draft is invalid. Preview the workbook again." }, { status: 422 });
    }
    if (rawStudents.length === 0 || rawStudents.length > 5000) {
      return NextResponse.json({ error: "The draft has no students or exceeds the import limit." }, { status: 422 });
    }

    const students = rawStudents.map((student) =>
      parseDraftStudent(student, draft, admin.id),
    );
    const validStudents = students.filter(
      (student): student is DraftStudent => student !== null,
    );
    if (validStudents.length !== rawStudents.length) {
      return NextResponse.json(
        { error: "The draft contains invalid student data. Preview the workbook again." },
        { status: 422 },
      );
    }
    const availableClasses = eligibleClassNames ?? [
      ...new Set(validStudents.map((student) => student.className)),
    ];
    const classNames = requestedClassNames ?? availableClasses;
    if (
      classNames.some((className) => !availableClasses.includes(className))
    ) {
      return NextResponse.json(
        { error: "One or more selected classes have blocking validation issues. Review the workbook preview." },
        { status: 422 },
      );
    }
    const selectedStudents = validStudents.filter((student) =>
      classNames.includes(student.className),
    );
    if (
      selectedStudents.length === 0 ||
      classNames.some(
        (className) => !selectedStudents.some((student) => student.className === className),
      )
    ) {
      return NextResponse.json(
        { error: "The selected classes contain no valid student records." },
        { status: 422 },
      );
    }
    const groups = new Map<string, ResultGroup>();
    for (const student of selectedStudents) {
      const key = JSON.stringify([student.academicYear, student.className, student.examinationKey]);
      const group = groups.get(key) ?? {
        academicYear: student.academicYear,
        className: student.className,
        examinationKey: student.examinationKey,
        students: [],
      };
      group.students.push(student);
      groups.set(key, group);
    }
    for (const group of groups.values()) {
      const seenRollNumbers = new Set<string>();
      for (const student of group.students) {
        const key = student.rollNumber.toLowerCase();
        if (seenRollNumbers.has(key)) {
          return NextResponse.json(
            { error: `Duplicate roll number ${student.rollNumber} in class ${group.className}. Preview the workbook again.` },
            { status: 422 },
          );
        }
        seenRollNumbers.add(key);
      }
    }

    if (importId) {
      const validating = await query<{ id: string }>(
        `update exam_result_imports set status='Validating', selected_classes=$2::jsonb,
         error_message='', updated_at=now()
         where id=$1 and status='Ready to Publish' returning id`,
        [importId, JSON.stringify(classNames)],
      );
      if (!validating.rows[0]) {
        return NextResponse.json(
          { error: "This import is already being processed or is no longer ready to publish." },
          { status: 409 },
        );
      }
      validationStarted = true;
    }

    const transaction = await db.connect();
    try {
      await transaction.query("begin");
      for (const student of selectedStudents) {
        await transaction.query(
          `insert into school_exam_results (academic_year,class_name,examination_key,examination_name,serial_number,examination_date,roll_number,student_name,subjects,total_marks,maximum_marks,percentage,automatic_grade,manual_grade,final_grade,result_status,published,published_at,created_by,import_id)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13,$14,$15,$16,$17,case when $17 then now() else null end,$18,$19)
           on conflict (academic_year,class_name,examination_key,roll_number) do update
           set examination_name=excluded.examination_name,serial_number=excluded.serial_number,
               examination_date=excluded.examination_date,student_name=excluded.student_name,
               subjects=excluded.subjects,total_marks=excluded.total_marks,
               maximum_marks=excluded.maximum_marks,percentage=excluded.percentage,
               automatic_grade=excluded.automatic_grade,manual_grade=excluded.manual_grade,
               final_grade=excluded.final_grade,result_status=excluded.result_status,
               published=excluded.published,published_at=excluded.published_at,
               created_by=excluded.created_by,import_id=excluded.import_id,updated_at=now()`,
          [
            student.academicYear,
            student.className,
            student.examinationKey,
            student.examinationName,
            student.serialNumber ?? "",
            student.examinationDate,
            student.rollNumber,
            student.studentName,
            JSON.stringify(student.subjects),
            student.totalMarks,
            student.maximumMarks,
            student.percentage,
            student.automaticGrade ?? "",
            student.manualGrade ?? "",
            student.finalGrade ?? "",
            student.resultStatus,
            publish,
            student.createdBy ?? admin.id,
            importId,
          ],
        );
      }

      if (mode === "replace") {
        for (const group of groups.values()) {
          const importedRollNumbers = group.students.map((student) => student.rollNumber);
          await transaction.query(
            "delete from school_exam_results where academic_year=$1 and class_name=$2 and examination_key=$3 and not (roll_number = any($4::text[]))",
            [group.academicYear, group.className, group.examinationKey, importedRollNumbers],
          );
        }
      }

      for (const group of groups.values()) {
        await transaction.query(
          "update school_exam_results set published=$4, published_at=case when $4 then coalesce(published_at, now()) else null end, updated_at=now() where academic_year=$1 and class_name=$2 and examination_key=$3",
          [group.academicYear, group.className, group.examinationKey, publish],
        );
      }
      await transaction.query(
        `update exam_result_imports i
         set published_student_count=(
               select count(*)::int from school_exam_results r
               where r.import_id=i.id and r.published
             ),
             status=case when exists (
               select 1 from school_exam_results r where r.import_id=i.id and r.published
             ) then 'Published' else 'Ready to Publish' end,
             completed_at=case when exists (
               select 1 from school_exam_results r where r.import_id=i.id and r.published
             ) then now() else null end,
             updated_at=now()
         where i.id in (
           select distinct r.import_id from school_exam_results r
           where (r.academic_year,r.class_name,r.examination_key) in (
             select * from unnest($1::text[],$2::text[],$3::text[])
           ) and r.import_id is not null
         ) and ($4::text is null or i.id<>$4)`,
        [
          [...groups.values()].map((group) => group.academicYear),
          [...groups.values()].map((group) => group.className),
          [...groups.values()].map((group) => group.examinationKey),
          importId,
        ],
      );
      if (importId) {
        await transaction.query(
          `update exam_result_imports set status=$2, selected_classes=$3::jsonb,
           student_count=$4, published_student_count=$5, updated_at=now(),
           completed_at=case when $2='Published' then now() else completed_at end
           where id=$1`,
          [
            importId,
            publish ? "Published" : "Ready to Publish",
            JSON.stringify(classNames),
            selectedStudents.length,
            publish ? selectedStudents.length : 0,
          ],
        );
      }
      await transaction.query(
        `update exam_import_drafts
         set students='[]'::jsonb, existing_roll_numbers='[]'::jsonb,
             removed_roll_numbers='[]'::jsonb, updated_at=now()
         where id=$1 and admin_id=$2`,
        [draftId, admin.id],
      );
      const count = await transaction.query<{ count: string }>(
        "select count(*) from school_exam_results where (academic_year, class_name, examination_key) in (select * from unnest($1::text[], $2::text[], $3::text[]))",
        [
          [...groups.values()].map((group) => group.academicYear),
          [...groups.values()].map((group) => group.className),
          [...groups.values()].map((group) => group.examinationKey),
        ],
      );
      await transaction.query("commit");

      return NextResponse.json({
        success: true,
        message: publish
          ? `${selectedStudents.length} student result(s) published across ${groups.size} selected class/examination group(s).`
          : mode === "replace"
            ? "Examination records replaced successfully. Results are ready to publish."
            : "Examination records updated successfully. Results are ready to publish.",
        mode,
        studentCount: Number(count.rows[0].count),
        importedStudentCount: selectedStudents.length,
        classCount: new Set([...groups.values()].map((group) => group.className)).size,
        published: publish,
        status: publish ? "Published" : "Ready to Publish",
        selectedClasses: classNames,
        importId,
      });
    } catch (error) {
      await transaction.query("rollback");
      throw error;
    } finally {
      transaction.release();
    }
  } catch (error) {
    console.error("Exam result commit error:", error);
    if (importId && validationStarted) {
      try {
        await query(
          `update exam_result_imports set status='Failed', error_message=$2,
           updated_at=now(), completed_at=now() where id=$1 and status='Validating'`,
          [
            importId,
            error instanceof Error ? error.message.slice(0, 2000) : "Import transaction failed.",
          ],
        );
      } catch (historyError) {
        console.error("Exam result import history failure:", historyError);
      }
    }
    return NextResponse.json(
      { error: "Unable to commit examination records. Check the server logs." },
      { status: 500 },
    );
  }
}
