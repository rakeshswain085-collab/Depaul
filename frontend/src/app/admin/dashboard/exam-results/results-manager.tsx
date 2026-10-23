"use client";

import { useCallback, useEffect, useState } from "react";
import { SCHOOL_CLASSES } from "@/lib/school-classes";

type Examination = {
  academicYear: string;
  className: string;
  examinationKey: string;
  examinationName: string;
  studentCount: number;
  publishedCount: number;
  published: boolean;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  error?: string;
  examinations?: Examination[];
  importedCount?: number;
  errorCount?: number;
  errors?: string[];
  invalidRows?: string[];
  duplicateRollNumbers?: string[];
};

type PreviewStudent = {
  rollNumber: string;
  studentName: string;
  totalMarks: number;
  maximumMarks: number;
  percentage: number;
  finalGrade: string;
  resultStatus: string;
};

type ImportSummary = {
  importedStudentCount: number;
  existingStudentCount: number;
  newStudentCount: number;
  matchingStudentCount: number;
  removedStudentCount: number;
  newRollNumbers: string[];
  matchingRollNumbers: string[];
  removedRollNumbers: string[];
  examinationName: string;
  academicYear: string;
  className: string;
};

type ImportPreview = {
  success: boolean;
  draftId: string;
  expiresAt: string;
  summary: ImportSummary;
  students: PreviewStudent[];
};

const YEARS = [
  "2026-27",
  "2025-26",
  "2024-25",
  "2023-24",
  "2022-23",
  "2021-22",
];

export default function ExamResultsManager() {
  const [academicYear, setAcademicYear] = useState("2026-27");
  const [className, setClassName] = useState("10");
  const [examinationName, setExaminationName] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [filterYear, setFilterYear] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [status, setStatus] = useState<ApiResponse | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importMode, setImportMode] = useState<"update" | "replace">("update");

  const loadExaminations = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (filterYear) params.set("academicYear", filterYear);
      if (filterClass) params.set("className", filterClass);

      const response = await fetch(
        `/api/admin/exam-results?${params.toString()}`,
        { cache: "no-store" },
      );

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || "Unable to load examinations.");
      }

      setExaminations(data.examinations ?? []);
    } catch (error) {
      setStatus({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load examinations.",
      });
    } finally {
      setLoading(false);
    }
  }, [filterYear, filterClass]);

  useEffect(() => {
    void loadExaminations();
  }, [loadExaminations]);

  async function previewImport() {
    setStatus(null);
    setImportPreview(null);

    if (!examinationName.trim()) {
      setStatus({ success: false, message: "Enter an examination name." });
      return;
    }

    if (!file) {
      setStatus({
        success: false,
        message: "Choose an Excel (.xlsx) or CSV (.csv) file.",
      });
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!["xlsx", "csv"].includes(extension ?? "")) {
      setStatus({
        success: false,
        message: "Only .xlsx and .csv files are supported.",
      });
      return;
    }

    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      setStatus({
        success: false,
        message: "The file must be between 1 byte and 5 MB.",
      });
      return;
    }

    const form = new FormData();
    form.set("academicYear", academicYear);
    form.set("className", className);
    form.set("examinationName", examinationName.trim());
    form.set("file", file);

    setPreviewLoading(true);

    try {
      const response = await fetch("/api/admin/exam-results/preview", {
        method: "POST",
        body: form,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorList = Array.isArray(data.errors)
          ? data.errors.join("\n")
          : "";
        throw new Error(
          `${data.error || data.message || "Preview failed."}${
            errorList ? `\n${errorList}` : ""
          }`,
        );
      }

      setImportPreview(data as ImportPreview);
      setImportMode("update");
    } catch (error) {
      setStatus({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Preview failed. Check your file and try again.",
      });
    } finally {
      setPreviewLoading(false);
    }
  }

  async function commitImport() {
    if (!importPreview?.draftId) return;

    const summary = importPreview.summary;
    const confirmation =
      importMode === "replace"
        ? `Replace the student list for ${summary.examinationName}, Class ${summary.className}, ${summary.academicYear}?\n\n` +
          `${summary.importedStudentCount} students are in the uploaded file.\n` +
          `${summary.removedStudentCount} existing student records will be deleted because they are missing from the file.\n\n` +
          "This cannot be undone. Continue only if you have checked the preview and backed up important data."
        : `Update ${summary.examinationName}, Class ${summary.className}, ${summary.academicYear}?\n\n` +
          `${summary.importedStudentCount} students will be inserted or updated.\n` +
          "Existing students missing from the file will be retained.";

    if (!window.confirm(confirmation)) return;

    setBusy(true);
    setStatus(null);

    try {
      const response = await fetch("/api/admin/exam-results/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: importPreview.draftId,
          mode: importMode,
        }),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || "Unable to save records.");
      }

      setStatus({
        success: true,
        message:
          data.message ||
          "Records saved. Review the examination and publish it when ready.",
      });
      setImportPreview(null);
      setFile(null);
      setExaminationName("");

      const fileInput = document.getElementById(
        "exam-marksheet",
      ) as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";

      setFilterYear(summary.academicYear);
      setFilterClass(summary.className);

      // Refresh immediately with the current filters. The effect will also
      // refresh when the filter state updates.
      await loadExaminations();
    } catch (error) {
      setStatus({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to save records.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function changeExamination(
    examination: Examination,
    action: "publish" | "unpublish" | "delete",
  ) {
    const message =
      action === "delete"
        ? `Permanently delete ${examination.examinationName} for ${examination.className}, ${examination.academicYear}? All student records for this examination will be deleted.`
        : action === "publish"
          ? `Publish all results for ${examination.examinationName}, Class ${examination.className}, ${examination.academicYear}?`
          : `Unpublish all results for ${examination.examinationName}, Class ${examination.className}, ${examination.academicYear}?`;

    if (!window.confirm(message)) return;

    setBusy(true);
    setStatus(null);

    try {
      const response = await fetch("/api/admin/exam-results", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          academicYear: examination.academicYear,
          className: examination.className,
          examinationKey: examination.examinationKey,
        }),
      });

      const data = (await response.json()) as ApiResponse;

      setStatus(data);

      if (response.ok && data.success) {
        await loadExaminations();
      }
    } catch {
      setStatus({
        success: false,
        message: "The requested action failed.",
      });
    } finally {
      setBusy(false);
    }
  }

  function formatDate(value: string | null) {
    if (!value) return "—";

    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">Upload marksheet</h2>
          <p className="mt-1 text-sm text-slate-600">
            Uploading creates a temporary preview only. Existing records are
            not changed until you confirm Update or Replace.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Academic year
              <select
                value={academicYear}
                onChange={(event) => setAcademicYear(event.target.value)}
                disabled={busy || previewLoading}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal"
              >
                {YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Class
              <select
                value={className}
                onChange={(event) => setClassName(event.target.value)}
                disabled={busy || previewLoading}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal"
              >
                {SCHOOL_CLASSES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-4 block text-sm font-semibold text-slate-700">
            Examination name
            <input
              value={examinationName}
              onChange={(event) => setExaminationName(event.target.value)}
              placeholder="e.g. Half-Yearly Examination"
              maxLength={100}
              disabled={busy || previewLoading}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal"
            />
          </label>

          <label className="mt-4 block text-sm font-semibold text-slate-700">
            Excel or CSV file
            <input
              id="exam-marksheet"
              type="file"
              accept=".xlsx,.csv"
              disabled={busy || previewLoading}
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setStatus(null);
                setImportPreview(null);
              }}
              className="mt-2 block w-full rounded-xl border border-slate-300 p-3 text-sm font-normal file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-semibold"
            />
          </label>

          {file && (
            <p className="mt-2 text-xs text-slate-500">
              Selected: {file.name} · {(file.size / 1024).toFixed(1)} KB
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy || previewLoading}
              onClick={() => void previewImport()}
              className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
            >
              {previewLoading ? "Validating file…" : "Preview & Validate"}
            </button>
            <button
              type="button"
              disabled={busy || previewLoading}
              onClick={() => {
                setFile(null);
                setExaminationName("");
                setImportPreview(null);
                setStatus(null);
                const fileInput = document.getElementById(
                  "exam-marksheet",
                ) as HTMLInputElement | null;
                if (fileInput) fileInput.value = "";
              }}
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold hover:bg-slate-50 disabled:opacity-50"
            >
              Clear
            </button>
          </div>

          {status && (
            <div
              role="status"
              className={`mt-5 whitespace-pre-wrap rounded-xl border p-4 text-sm ${
                status.success
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              <p className="font-semibold">
                {status.message || (status.success ? "Success." : "Failed.")}
              </p>
              {status.importedCount !== undefined && (
                <p className="mt-1">
                  Student records processed: {status.importedCount}
                </p>
              )}
              {!!status.errors?.length && (
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {status.errors.slice(0, 20).map((error, index) => (
                    <li key={`${error}-${index}`}>{error}</li>
                  ))}
                </ul>
              )}
              {!!status.invalidRows?.length && (
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {status.invalidRows.slice(0, 20).map((error, index) => (
                    <li key={`${error}-${index}`}>{error}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="font-bold text-slate-900">Spreadsheet requirements</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            The first worksheet must contain one student per row. Required
            columns are Roll Number, Student Name, Subject 1 Name, Subject 1
            Maximum Marks and Subject 1 Marks Obtained. Add the equivalent
            columns for each additional subject.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Use the same examination name when importing additional students
            for the same class and academic year. Upload a separate file for
            each different class.
          </p>
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            Preview does not modify existing records. After committing changes,
            the examination is unpublished and must be reviewed before you
            publish it.
          </p>
        </aside>
      </div>

      {importPreview && (
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
              Step 2
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Preview & Validate
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {importPreview.summary.examinationName} · Class{" "}
              {importPreview.summary.className} ·{" "}
              {importPreview.summary.academicYear}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              This draft expires at{" "}
              {new Date(importPreview.expiresAt).toLocaleString("en-IN")}.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Imported students", importPreview.summary.importedStudentCount],
              ["New students", importPreview.summary.newStudentCount],
              ["Matching students", importPreview.summary.matchingStudentCount],
              ["Would be removed", importPreview.summary.removedStudentCount],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl border p-4">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div>
            <label
              htmlFor="import-mode"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Choose how to apply this file
            </label>
            <select
              id="import-mode"
              value={importMode}
              onChange={(event) =>
                setImportMode(event.target.value as "update" | "replace")
              }
              disabled={busy}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm"
            >
              <option value="update">
                Update — add/update imported students and retain other students
              </option>
              <option value="replace">
                Replace — remove existing students missing from this file
              </option>
            </select>
          </div>

          {importMode === "replace" &&
            importPreview.summary.removedRollNumbers.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <h3 className="font-bold text-red-800">
                  Students to be removed
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  The following roll numbers are in the existing examination
                  but not in this upload:
                </p>
                <p className="mt-3 break-words text-sm text-red-900">
                  {importPreview.summary.removedRollNumbers.join(", ")}
                </p>
              </div>
            )}

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Roll number</th>
                  <th className="px-4 py-3">Student name</th>
                  <th className="px-4 py-3">Marks</th>
                  <th className="px-4 py-3">Percentage</th>
                  <th className="px-4 py-3">Grade</th>
                  <th className="px-4 py-3">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {importPreview.students.map((student) => (
                  <tr key={student.rollNumber}>
                    <td className="whitespace-nowrap px-4 py-3">
                      {student.rollNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {student.studentName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {student.totalMarks}/{student.maximumMarks}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {student.percentage}%
                    </td>
                    <td className="px-4 py-3">{student.finalGrade}</td>
                    <td className="px-4 py-3">{student.resultStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void commitImport()}
              disabled={busy}
              className={`rounded-xl px-5 py-3 text-sm font-bold text-white disabled:opacity-50 ${
                importMode === "replace"
                  ? "bg-red-700 hover:bg-red-600"
                  : "bg-slate-900 hover:bg-slate-700"
              }`}
            >
              {busy
                ? "Saving records…"
                : importMode === "replace"
                  ? "Confirm Replace"
                  : "Confirm Update"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setImportPreview(null)}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel preview
            </button>
          </div>
          <p className="text-xs leading-5 text-slate-500">
            Confirming either option saves the imported records as unpublished.
            You must use the Publish all action below after reviewing them.
            Replace permanently deletes missing student records; back up your
            database before using it.
          </p>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Uploaded examinations
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Filter, publish, unpublish or delete imported examination records.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadExaminations()}
            disabled={loading || busy}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            Refresh list
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            Filter by academic year
            <select
              value={filterYear}
              onChange={(event) => setFilterYear(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal"
            >
              <option value="">All academic years</option>
              {YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Filter by class
            <select
              value={filterClass}
              onChange={(event) => setFilterClass(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal"
            >
              <option value="">All classes</option>
              {SCHOOL_CLASSES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Loading examinations…
          </p>
        ) : examinations.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center">
            <p className="font-semibold text-slate-700">
              No uploaded examinations found.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Upload a marksheet above, or change the filters.
            </p>
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Academic year</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Examination</th>
                  <th className="px-4 py-3">Students</th>
                  <th className="px-4 py-3">Last updated</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {examinations.map((exam) => (
                  <tr
                    key={`${exam.academicYear}-${exam.className}-${exam.examinationKey}`}
                    className="align-top"
                  >
                    <td className="whitespace-nowrap px-4 py-4">
                      {exam.academicYear}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      {SCHOOL_CLASSES.find(
                        (item) => item.value === exam.className,
                      )?.label ?? exam.className}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {exam.examinationName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      {exam.studentCount}
                      {exam.publishedCount < exam.studentCount && (
                        <p className="mt-1 text-xs text-amber-700">
                          {exam.studentCount - exam.publishedCount} unpublished
                        </p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                      {formatDate(exam.updatedAt)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                          exam.publishedCount === exam.studentCount
                            ? "bg-emerald-100 text-emerald-800"
                            : exam.publishedCount === 0
                              ? "bg-slate-100 text-slate-700"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {exam.publishedCount === exam.studentCount
                          ? "Published"
                          : exam.publishedCount === 0
                            ? "Draft"
                            : "Partially published"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void changeExamination(
                              exam,
                              exam.publishedCount === exam.studentCount
                                ? "unpublish"
                                : "publish",
                            )
                          }
                          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold hover:bg-slate-50 disabled:opacity-50"
                        >
                          {exam.publishedCount === exam.studentCount
                            ? "Unpublish"
                            : "Publish all"}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void changeExamination(exam, "delete")}
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
