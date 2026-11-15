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

type ImportHistory = {
  id: string;
  fileName: string;
  status: "Draft" | "Validating" | "Ready to Publish" | "Published" | "Failed";
  detectedClasses: string[];
  selectedClasses: string[];
  studentCount: number;
  publishedStudentCount: number;
  failedRecords: Array<Record<string, unknown>>;
  errorMessage: string;
  createdAt: string;
  completedAt: string | null;
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
  importedStudentCount?: number;
  importHistory?: ImportHistory[];
  published?: boolean;
  status?: string;
  selectedClasses?: string[];
};

type PreviewStudent = {
  worksheet: string;
  rowNumber: number;
  serialNumber: string;
  rollNumber: string;
  studentName: string;
  className: string;
  academicYear: string;
  examinationName: string;
  examinationDate: string | null;
  subjects: Array<{
    subject: string;
    maxMarks: string | number | boolean | null;
    marksObtained: string | number | boolean | null;
    grade: string;
    remarks: string;
  }>;
  totalMarks: string | number | boolean | null;
  maximumMarks: string | number | boolean | null;
  percentage: string | number | boolean | null;
  grade: string;
  resultStatus: string;
  errors: string[];
};

type PreviewWorksheet = {
  worksheet: string;
  className: string | null;
  studentCount: number;
  subjects: string[];
  examinationName: string;
  academicYear: string;
  examinationDate: string | null;
  detected: boolean;
  warnings: string[];
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
  classNames: string[];
};

type ImportPreview = {
  success: boolean;
  canCommit: boolean;
  eligibleClassNames: string[];
  draftId: string | null;
  expiresAt: string | null;
  summary: ImportSummary;
  worksheets: PreviewWorksheet[];
  students: PreviewStudent[];
  warnings: string[];
  errors: string[];
  duplicates: Array<{
    worksheet: string;
    rowNumber: number;
    duplicateOfWorksheet: string;
    duplicateOfRow: number;
    className: string;
    rollNumber: string;
    studentName: string;
  }>;
  missingData: Array<{
    worksheet: string;
    rowNumber: number;
    field: string;
    cell: string | null;
  }>;
};

function displayWorkbookValue(value: string | number | boolean | null): string {
  return value === null ? "—" : String(value);
}

function getRemovedRollNumbers(summary: ImportSummary, classNames: string[]): string[] {
  if (summary.classNames.length === 1) return summary.removedRollNumbers;
  return summary.removedRollNumbers.filter((item) =>
    classNames.some((name) => item.startsWith(`${name}: `)),
  );
}

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
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<ApiResponse | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importMode, setImportMode] = useState<"update" | "replace">("update");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [previewClass, setPreviewClass] = useState<string | null>(null);

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
      setImportHistory(data.importHistory ?? []);
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

    if (!file) {
      setStatus({
        success: false,
        message: "Choose an Excel (.xlsx or .xls) or CSV (.csv) file.",
      });
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!["xlsx", "xls", "csv"].includes(extension ?? "")) {
      setStatus({
        success: false,
        message: "Only .xlsx, .xls, and .csv files are supported.",
      });
      return;
    }

    if (file.size === 0 || file.size > 10 * 1024 * 1024) {
      setStatus({
        success: false,
        message: "The file must be between 1 byte and 10 MB.",
      });
      return;
    }

    const form = new FormData();
    form.set("academicYear", academicYear);
    form.set("className", className);
    form.set("examinationName", examinationName.trim());
    form.set("file", file);

    setPreviewLoading(true);
    setUploadProgress(0);

    try {
      const { response, data } = await new Promise<{
        response: XMLHttpRequest;
        data: ImportPreview & { error?: string; message?: string };
      }>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("POST", "/api/admin/exam-results/preview");
        request.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        });
        request.addEventListener("load", () => {
          let body: ImportPreview & { error?: string; message?: string };
          try {
            body = JSON.parse(request.responseText) as typeof body;
          } catch {
            reject(new Error("The server returned an invalid preview response."));
            return;
          }
          resolve({ response: request, data: body });
        });
        request.addEventListener("error", () => reject(new Error("The workbook upload failed. Check your connection and try again.")));
        request.addEventListener("abort", () => reject(new Error("The workbook upload was cancelled.")));
        request.send(form);
      });

      if (response.status < 200 || response.status >= 300 || !data.success) {
        const errorList = Array.isArray(data.errors)
          ? data.errors.join("\n")
          : "";
        throw new Error(
          `${data.error || data.message || "Preview failed."}${
            errorList ? `\n${errorList}` : ""
          }`,
        );
      }

      const classNames = data.eligibleClassNames ?? [];
      setImportPreview(data);
      setSelectedClasses(classNames);
      const firstClass = data.worksheets.find(
        (worksheet) => worksheet.className && worksheet.detected,
      )?.className;
      setPreviewClass(firstClass ?? null);
      setImportMode("update");
      setUploadProgress(100);
      await loadExaminations();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Preview failed. Check your file and try again.";
      await loadExaminations();
      setStatus({
        success: false,
        message,
      });
    } finally {
      setPreviewLoading(false);
      window.setTimeout(() => setUploadProgress(null), 800);
    }
  }

  async function commitImport(classNames = selectedClasses) {
    if (!importPreview?.draftId || classNames.length === 0) return;

    const summary = importPreview.summary;
    const removedRollNumbers = getRemovedRollNumbers(summary, classNames);
    const isSelectedSubset = classNames.length !== importPreview.eligibleClassNames.length;
    const selectedStudents = importPreview.students.filter((student) =>
      classNames.includes(student.className),
    );
    const selectedExaminations = [
      ...new Set(
        importPreview.worksheets
          .filter(
            (worksheet): worksheet is PreviewWorksheet & { className: string } =>
              Boolean(worksheet.className && classNames.includes(worksheet.className)),
          )
          .map((worksheet) => worksheet.examinationName)
          .filter(Boolean),
      ),
    ];
    const studentCount = selectedStudents.filter((student) => student.errors.length === 0).length;
    const excludedStudentCount = selectedStudents.length - studentCount;
    const confirmation =
      importMode === "replace"
        ? `Publish ${selectedExaminations.join(", ") || summary.examinationName} results for ${classNames.join(", ")}, ${summary.academicYear}?\n\n` +
          `${studentCount} valid student records will be imported and published. ${excludedStudentCount} record(s) with blocking validation issues will be excluded.\n` +
          `${removedRollNumbers.length} existing student records for selected classes will be deleted because they are missing from the workbook.\n\n` +
          "This cannot be undone. Continue only after reviewing the workbook and confirming the selected classes."
        : `Publish ${selectedExaminations.join(", ") || summary.examinationName} results for ${classNames.join(", ")} (${summary.academicYear})?\n\n` +
          `${studentCount} valid student records will be imported and published. ${excludedStudentCount} record(s) with blocking validation issues will be excluded.\n` +
          (isSelectedSubset ? "Unselected classes will not be imported or published. " : "") +
          "Confirm only after reviewing the marks and validation details.";

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
          classNames,
          publish: true,
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
          `${data.importedStudentCount ?? studentCount} result(s) published successfully.`,
      });
      setImportPreview(null);
      setSelectedClasses([]);
      setPreviewClass(null);
      setFile(null);
      setExaminationName("");

      const fileInput = document.getElementById(
        "exam-marksheet",
      ) as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";

      setFilterYear(/^\d{4}-\d{2}$/.test(summary.academicYear) ? summary.academicYear : "");
      setFilterClass(classNames.length === 1 ? classNames[0] : "");

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

  function setSelectedFile(selectedFile: File | null) {
    setFile(selectedFile);
    setStatus(null);
    setImportPreview(null);
    setSelectedClasses([]);
    setPreviewClass(null);
  }

  const classSummaries = importPreview
    ? [...new Set(importPreview.worksheets.map((worksheet) => worksheet.className).filter(
        (name): name is string => Boolean(name),
      ))].map((name) => {
        const worksheets = importPreview.worksheets.filter(
          (worksheet) => worksheet.className === name,
        );
        const worksheetNames = worksheets.map((worksheet) => worksheet.worksheet);
        const students = importPreview.students.filter(
          (student) => student.className === name,
        );
        const errors = importPreview.errors.filter((error) =>
          worksheetNames.some((worksheet) =>
            error.startsWith(`${worksheet}!`) ||
            error.startsWith(`${worksheet}:`) ||
            error.startsWith(`${worksheet} row `),
          ),
        );
        return {
          name,
          worksheets,
          worksheetNames,
          students,
          subjects: [...new Set(worksheets.flatMap((worksheet) => worksheet.subjects))],
          examinations: [...new Set(worksheets.map((worksheet) => worksheet.examinationName).filter(Boolean))],
          validStudentCount: students.filter((student) => student.errors.length === 0).length,
          invalidStudentCount: students.filter((student) => student.errors.length > 0).length,
          duplicateCount: importPreview.duplicates.filter(
            (duplicate) => duplicate.className === name,
          ).length,
          missingCount: importPreview.missingData.filter((item) =>
            worksheetNames.includes(item.worksheet),
          ).length,
          errorCount: errors.length,
          eligible: importPreview.eligibleClassNames.includes(name),
        };
      })
    : [];
  const activeClass = classSummaries.find(
    (item) => item.name === previewClass,
  );
  return (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-sm font-bold text-amber-900">01</span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Upload examination workbook</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Choose an Excel workbook to detect class worksheets and review the actual stored marks before saving.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Academic year fallback
              <select
                value={academicYear}
                onChange={(event) => setAcademicYear(event.target.value)}
                disabled={busy || previewLoading}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal"
              >
                {YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Class fallback
              <select
                value={className}
                onChange={(event) => setClassName(event.target.value)}
                disabled={busy || previewLoading}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal"
              >
                {SCHOOL_CLASSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
          </div>

          <label className="mt-4 block text-sm font-semibold text-slate-700">
            Examination name fallback
            <input
              value={examinationName}
              onChange={(event) => setExaminationName(event.target.value)}
              placeholder="e.g. Half-Yearly Examination"
              maxLength={100}
              disabled={busy || previewLoading}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal"
            />
          </label>

          <div
            onDragOver={(event) => {
              event.preventDefault();
              if (!busy && !previewLoading) setDragActive(true);
            }}
            onDragLeave={(event) => {
              const nextTarget = event.relatedTarget;
              if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
                setDragActive(false);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              if (!busy && !previewLoading) {
                setSelectedFile(event.dataTransfer.files[0] ?? null);
              }
            }}
            className={`mt-5 rounded-2xl border-2 border-dashed p-6 text-center transition ${
              dragActive ? "border-amber-500 bg-amber-50" : "border-slate-300 bg-slate-50"
            }`}
          >
            <input
              id="exam-marksheet"
              type="file"
              accept=".xlsx,.xls,.csv"
              disabled={busy || previewLoading}
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              className="sr-only"
            />
            <p className="font-semibold text-slate-800">
              {dragActive ? "Drop the workbook to select it" : "Drag and drop your workbook here"}
            </p>
            <p className="mt-1 text-sm text-slate-500">Excel .xlsx or .xls · Maximum 10 MB</p>
            <label
              htmlFor="exam-marksheet"
              className={`mt-4 inline-flex cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 ${
                busy || previewLoading ? "pointer-events-none opacity-50" : ""
              }`}
            >
              Browse files
            </label>
          </div>

          {file && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{file.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {file.size >= 1024 * 1024
                    ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                    : `${(file.size / 1024).toFixed(1)} KB`}
                </p>
              </div>
              <button
                type="button"
                disabled={busy || previewLoading}
                onClick={() => {
                  setSelectedFile(null);
                  const input = document.getElementById("exam-marksheet") as HTMLInputElement | null;
                  if (input) input.value = "";
                }}
                className="text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-50"
              >
                Remove file
              </button>
            </div>
          )}

          {previewLoading && uploadProgress !== null && (
            <div className="mt-4" aria-live="polite">
              <div className="mb-1 flex justify-between text-xs text-slate-600">
                <span>{uploadProgress < 100 ? "Uploading workbook…" : "Processing workbook…"}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-amber-500 transition-[width]" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy || previewLoading || !file}
              onClick={() => void previewImport()}
              className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
            >
              {previewLoading ? "Uploading and detecting…" : "Upload & detect worksheets"}
            </button>
            <button
              type="button"
              disabled={busy || previewLoading}
              onClick={() => {
                setSelectedFile(null);
                setExaminationName("");
                setStatus(null);
                const input = document.getElementById("exam-marksheet") as HTMLInputElement | null;
                if (input) input.value = "";
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
                status.success ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              <p className="font-semibold">{status.message || (status.success ? "Success." : "Failed.")}</p>
              {status.importedCount !== undefined && <p className="mt-1">Student records processed: {status.importedCount}</p>}
              {!!status.errors?.length && <ul className="mt-2 list-disc space-y-1 pl-5">{status.errors.slice(0, 20).map((error, index) => <li key={`${error}-${index}`}>{error}</li>)}</ul>}
              {!!status.invalidRows?.length && <ul className="mt-2 list-disc space-y-1 pl-5">{status.invalidRows.slice(0, 20).map((error, index) => <li key={`${error}-${index}`}>{error}</li>)}</ul>}
            </div>
          )}
        </section>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="font-bold text-slate-900">Review before publishing</h2>
          <ol className="mt-3 space-y-3 text-sm text-slate-600">
            <li className="flex gap-3"><span className="font-bold text-amber-700">1</span><span>Upload a workbook; no results are saved or published yet.</span></li>
            <li className="flex gap-3"><span className="font-bold text-amber-700">2</span><span>Review detected classes, validation status, and student marks.</span></li>
            <li className="flex gap-3"><span className="font-bold text-amber-700">3</span><span>Confirm publication for all or selected valid classes.</span></li>
            <li className="flex gap-3"><span className="font-bold text-amber-700">4</span><span>Review publication counts and import history below.</span></li>
          </ol>
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            Totals, percentages, and grades are shown from workbook values. The system never recalculates them.
          </p>
        </aside>
      </div>

      {importPreview && (
        <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Step 2 · Detect & review</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Detected worksheets</h2>
              <p className="mt-1 text-sm text-slate-600">
                {importPreview.summary.examinationName} · {importPreview.summary.academicYear}
                {importPreview.expiresAt && ` · Preview expires ${new Date(importPreview.expiresAt).toLocaleString("en-IN")}`}
              </p>
            </div>
            <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
              {importPreview.worksheets.length} worksheet{importPreview.worksheets.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-800">
              Select classes to save · {selectedClasses.length} of {importPreview.eligibleClassNames.length} ready
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy || importPreview.eligibleClassNames.length === 0}
                onClick={() => setSelectedClasses([...importPreview.eligibleClassNames])}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
              >
                Select all classes
              </button>
              <button
                type="button"
                disabled={busy || selectedClasses.length === 0}
                onClick={() => setSelectedClasses([])}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
              >
                Deselect all
              </button>
            </div>
          </div>

          {classSummaries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600">
              No class worksheets could be detected. Review the workbook errors below.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {classSummaries.map((item) => {
                const label = SCHOOL_CLASSES.find((schoolClass) => schoolClass.value === item.name)?.label ?? `Class ${item.name}`;
                const selected = selectedClasses.includes(item.name);
                return (
                  <article
                    key={item.name}
                    className={`rounded-xl border p-4 transition ${
                      previewClass === item.name ? "border-amber-400 ring-1 ring-amber-200" : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900">{label}</p>
                        <p className="mt-1 break-words text-xs text-slate-500">{item.worksheetNames.join(", ")}</p>
                        {item.examinations.length > 0 && (
                          <p className="mt-1 break-words text-xs text-slate-500">
                            Examination{item.examinations.length === 1 ? "" : "s"}: {item.examinations.join(", ")}
                          </p>
                        )}
                      </div>
                      <label className="flex shrink-0 items-center gap-2 text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={busy || !item.eligible}
                          onChange={(event) => {
                            setSelectedClasses((current) =>
                              event.target.checked
                                ? [...current, item.name]
                                : current.filter((name) => name !== item.name),
                            );
                          }}
                          aria-label={`Select ${label}`}
                          className="h-4 w-4 rounded border-slate-300 accent-amber-500"
                        />
                        Select
                      </label>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div><p className="text-xs text-slate-500">Valid students</p><p className="mt-0.5 font-semibold">{item.validStudentCount}</p></div>
                      <div><p className="text-xs text-slate-500">Subjects</p><p className="mt-0.5 font-semibold">{item.subjects.length}</p></div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        item.eligible ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
                      }`}>
                        {item.eligible ? "Ready" : "Review required"}
                      </span>
                      {item.errorCount > 0 && <span className="text-xs text-red-700">{item.errorCount} validation issue(s)</span>}
                      {item.invalidStudentCount > 0 && item.eligible && <span className="text-xs text-amber-800">{item.invalidStudentCount} invalid record(s) excluded</span>}
                      {item.duplicateCount > 0 && <span className="text-xs text-amber-800">{item.duplicateCount} duplicate(s)</span>}
                      {item.missingCount > 0 && <span className="text-xs text-red-700">{item.missingCount} missing/invalid field(s)</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewClass(item.name)}
                      className="mt-4 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50"
                    >
                      Preview {item.students.length} student record{item.students.length === 1 ? "" : "s"}
                    </button>
                  </article>
                );
              })}
            </div>
          )}

          {importPreview.worksheets.some((worksheet) => !worksheet.className || !worksheet.detected) && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              <h3 className="font-bold">Worksheets needing attention</h3>
              <ul className="mt-2 space-y-2">
                {importPreview.worksheets.filter((worksheet) => !worksheet.className || !worksheet.detected).map((worksheet) => (
                  <li key={worksheet.worksheet}>
                    <span className="font-semibold">{worksheet.worksheet}:</span>{" "}
                    {worksheet.warnings.join(" ") || "No class and student table could be detected."}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Validation overview</h3>
                <p className="mt-1 text-xs text-slate-500">Records with blocking issues are retained here for review and excluded from saving.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["Valid records", importPreview.students.filter((student) => student.errors.length === 0).length],
                  ["Duplicates", importPreview.duplicates.length],
                  ["Missing details", importPreview.missingData.filter((item) => ["studentName", "rollNumber"].includes(item.field)).length],
                  ["Invalid marks", importPreview.missingData.filter((item) => item.field.toLowerCase().includes("marks")).length],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-[11px] text-slate-500">{label}</p>
                    <p className="text-lg font-bold text-slate-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            {(importPreview.errors.length > 0 || importPreview.warnings.length > 0 || importPreview.missingData.length > 0) && (
              <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">
                    Missing formula results ({importPreview.missingData.filter((item) => item.field === "formula result" || importPreview.errors.some((error) => error.includes(`${item.worksheet}!${item.cell}: formula result`))).length})
                  </h4>
                  <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-xs text-slate-600">
                    {importPreview.errors.filter((error) => error.includes("formula result is missing")).slice(0, 30).map((error, index) => <li key={`${error}-${index}`}>{error}</li>)}
                    {importPreview.missingData.filter((item) => item.field === "formula result").length === 0 && <li>None reported.</li>}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Duplicate records</h4>
                  <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-xs text-slate-600">
                    {importPreview.duplicates.slice(0, 30).map((item) => (
                      <li key={`${item.worksheet}-${item.rowNumber}-${item.duplicateOfWorksheet}-${item.duplicateOfRow}`}>
                        {item.worksheet} row {item.rowNumber}: {item.studentName || item.rollNumber || "Student"} duplicates {item.duplicateOfWorksheet} row {item.duplicateOfRow}.
                      </li>
                    ))}
                    {importPreview.duplicates.length === 0 && <li>None reported.</li>}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Missing student details</h4>
                  <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-xs text-slate-600">
                    {importPreview.missingData.filter((item) => ["studentName", "rollNumber"].includes(item.field)).slice(0, 30).map((item, index) => (
                      <li key={`${item.worksheet}-${item.rowNumber}-${item.field}-${index}`}>{item.worksheet} row {item.rowNumber}: {item.field} is missing or invalid{item.cell ? ` (${item.cell})` : ""}.</li>
                    ))}
                    {importPreview.missingData.filter((item) => ["studentName", "rollNumber"].includes(item.field)).length === 0 && <li>None reported.</li>}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Worksheet errors and warnings</h4>
                  <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-xs text-slate-600">
                    {[...importPreview.errors, ...importPreview.warnings].slice(0, 40).map((message, index) => <li key={`${message}-${index}`}>{message}</li>)}
                    {importPreview.errors.length === 0 && importPreview.warnings.length === 0 && <li>None reported.</li>}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {activeClass && (
            <section aria-label={`Student preview for class ${activeClass.name}`}>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Step 3 · Student preview</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">
                    {SCHOOL_CLASSES.find((item) => item.value === activeClass.name)?.label ?? `Class ${activeClass.name}`}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">{activeClass.students.length} records · {activeClass.subjects.length} subjects · original workbook values</p>
                </div>
                <label className="text-xs font-semibold text-slate-700">
                  Preview class
                  <select
                    value={activeClass.name}
                    onChange={(event) => setPreviewClass(event.target.value)}
                    className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    {classSummaries.map((item) => <option key={item.name} value={item.name}>{SCHOOL_CLASSES.find((schoolClass) => schoolClass.value === item.name)?.label ?? `Class ${item.name}`}</option>)}
                  </select>
                </label>
              </div>
              {activeClass.students.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600">No student rows were extracted from this worksheet.</div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-max text-left text-xs">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-600">
                      <tr>
                        <th className="sticky left-0 bg-slate-50 px-3 py-3">Sl. No.</th>
                        <th className="px-3 py-3">Student name</th>
                        <th className="px-3 py-3">Roll number</th>
                        {activeClass.subjects.map((subject) => <th key={subject} className="whitespace-nowrap px-3 py-3">{subject}<span className="block font-normal normal-case text-slate-400">obtained / max</span></th>)}
                        <th className="whitespace-nowrap px-3 py-3">Total maximum</th>
                        <th className="whitespace-nowrap px-3 py-3">Total obtained</th>
                        <th className="px-3 py-3">Percentage</th>
                        <th className="px-3 py-3">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeClass.students.map((student) => (
                        <tr key={`${student.worksheet}-${student.rowNumber}`} className={student.errors.length ? "bg-red-50/50" : ""}>
                          <td className="sticky left-0 bg-inherit px-3 py-3">{student.serialNumber || "—"}</td>
                          <td className="whitespace-nowrap px-3 py-3 font-medium text-slate-900">{student.studentName || "—"}</td>
                          <td className="px-3 py-3">{student.rollNumber || "—"}</td>
                          {activeClass.subjects.map((subjectName) => {
                            const subject = student.subjects.find((item) => item.subject === subjectName);
                            return <td key={subjectName} className="whitespace-nowrap px-3 py-3">{subject ? `${displayWorkbookValue(subject.marksObtained)} / ${displayWorkbookValue(subject.maxMarks)}` : "—"}</td>;
                          })}
                          <td className="whitespace-nowrap px-3 py-3">{displayWorkbookValue(student.maximumMarks)}</td>
                          <td className="whitespace-nowrap px-3 py-3">{displayWorkbookValue(student.totalMarks)}</td>
                          <td className="whitespace-nowrap px-3 py-3">{displayWorkbookValue(student.percentage)}</td>
                          <td className="px-3 py-3">{student.grade || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </section>
          )}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-900">Step 4 · Continue to publishing</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Confirming imports and publishes only valid student records from the selected classes in one database transaction. Rows with blocking issues are excluded and remain visible in the preview; unselected worksheets are untouched.
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="min-w-60 flex-1 text-xs font-semibold text-slate-700">
                Saving mode
                <select
                  id="import-mode"
                  value={importMode}
                  onChange={(event) => setImportMode(event.target.value as "update" | "replace")}
                  disabled={busy}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="update">Update — retain existing students missing from the workbook</option>
                  <option value="replace">Replace — delete existing students missing from the selected classes</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => void commitImport(importPreview.eligibleClassNames)}
                disabled={busy || !importPreview.draftId || importPreview.eligibleClassNames.length === 0}
                className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {busy ? "Publishing results…" : "Publish All Ready Classes"}
              </button>
              <button
                type="button"
                onClick={() => void commitImport()}
                disabled={busy || !importPreview.draftId || selectedClasses.length === 0}
                className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
              >
                {busy ? "Publishing results…" : "Publish Selected Classes"}
              </button>
            </div>
            {importMode === "replace" && selectedClasses.length > 0 && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900">
                <p className="font-bold">
                  Replace will remove {getRemovedRollNumbers(importPreview.summary, selectedClasses).length} existing student record(s) missing from the selected classes.
                </p>
                {getRemovedRollNumbers(importPreview.summary, selectedClasses).length > 0 && (
                  <p className="mt-2 break-words">
                    {getRemovedRollNumbers(importPreview.summary, selectedClasses).join(", ")}
                  </p>
                )}
              </div>
            )}
            {importPreview.eligibleClassNames.length === 0 && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                No classes are ready to save. Resolve blocking validation issues and upload the workbook again.
              </p>
            )}
            {importPreview.eligibleClassNames.length < classSummaries.length && (
              <p className="mt-3 text-xs text-amber-800">
                Classes with worksheet-level errors or no valid records are not selectable. Other classes can be published independently; rows with blocking issues are excluded and shown above.
              </p>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => setImportPreview(null)}
              className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
            >
              Cancel preview
            </button>
          </div>
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

        <div className="mt-10 border-t border-slate-200 pt-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Import and publication history</h3>
              <p className="mt-1 text-sm text-slate-600">Recent workbook imports, selected classes, published counts, and validation or transaction failures.</p>
            </div>
            <span className="text-xs text-slate-500">{importHistory.length} recent import(s)</span>
          </div>
          {importHistory.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              No workbook import history yet.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Workbook</th>
                    <th className="px-4 py-3">Detected classes</th>
                    <th className="px-4 py-3">Published classes</th>
                    <th className="px-4 py-3">Students</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Imported</th>
                    <th className="px-4 py-3">Issues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importHistory.map((item) => (
                    <tr key={item.id} className="align-top">
                      <td className="max-w-56 px-4 py-3">
                        <p className="break-all font-medium text-slate-900">{item.fileName}</p>
                        {item.errorMessage && <p className="mt-1 text-xs text-red-700">{item.errorMessage}</p>}
                      </td>
                      <td className="max-w-52 px-4 py-3 text-slate-600">{item.detectedClasses.join(", ") || "—"}</td>
                      <td className="max-w-52 px-4 py-3 text-slate-600">{item.selectedClasses.join(", ") || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {item.publishedStudentCount} published
                        {item.studentCount > item.publishedStudentCount && (
                          <span className="block text-xs text-slate-500">{item.studentCount - item.publishedStudentCount} not published</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                          item.status === "Published" ? "bg-emerald-100 text-emerald-800" :
                          item.status === "Failed" ? "bg-red-100 text-red-800" :
                          item.status === "Validating" ? "bg-blue-100 text-blue-800" :
                          item.status === "Ready to Publish" ? "bg-amber-100 text-amber-800" :
                          "bg-slate-100 text-slate-700"
                        }`}>{item.status}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(item.createdAt)}</td>
                      <td className="px-4 py-3">
                        {item.failedRecords.length > 0 ? (
                          <details className="max-w-72">
                            <summary className="cursor-pointer text-xs font-semibold text-amber-800">
                              View {item.failedRecords.length} issue(s)
                            </summary>
                            <ul className="mt-2 max-h-40 list-disc space-y-1 overflow-auto pl-4 text-xs text-slate-600">
                              {item.failedRecords.slice(0, 100).map((record, index) => (
                                <li key={`${item.id}-${index}`}>
                                  {typeof record.message === "string"
                                    ? record.message
                                    : `${String(record.worksheet ?? "Workbook")}${record.rowNumber ? ` row ${String(record.rowNumber)}` : ""}${record.studentName ? ` · ${String(record.studentName)}` : ""}`}
                                </li>
                              ))}
                            </ul>
                          </details>
                        ) : <span className="text-xs text-slate-400">None</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
