
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { SCHOOL_CLASSES } from "@/lib/school-classes";

type Examination = {
  examinationName: string;
  examinationKey?: string;
};

type SubjectResult = {
  subject: string;
  maxMarks: number;
  marksObtained: number;
  grade?: string;
  remarks?: string;
};

type ExamResult = {
  academicYear: string;
  className: string;
  examinationName: string;
  examinationKey?: string;
  rollNumber: string;
  studentName: string;
  subjects: SubjectResult[];
  totalMarks: number;
  maximumMarks: number;
  percentage: number;
  automaticGrade?: string;
  manualGrade?: string;
  finalGrade?: string;
  resultStatus: string;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  examinations?: T[];
  result?: T;
};

const CURRENT_ACADEMIC_YEAR = "2026-27";

const ACADEMIC_YEARS = [
  "2026-27",
  "2025-26",
  "2024-25",
  "2023-24",
  "2022-23",
  "2021-22",
];

export default function ResultsPage() {
  const [academicYear, setAcademicYear] = useState(
    CURRENT_ACADEMIC_YEAR
  );
  const [className, setClassName] = useState("");
  const [examination, setExamination] = useState("");
  const [rollNumber, setRollNumber] = useState("");

  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [result, setResult] = useState<ExamResult | null>(null);

  const [loadingExaminations, setLoadingExaminations] = useState(false);
  const [loadingResult, setLoadingResult] = useState(false);
  const [error, setError] = useState("");
  const [examError, setExamError] = useState("");

  const selectedExamination = useMemo(
    () =>
      examinations.find(
        (exam) =>
          (exam.examinationKey || exam.examinationName) === examination
      ),
    [examinations, examination]
  );

  useEffect(() => {
    setResult(null);
    setError("");
    setExamError("");
    setExaminations([]);
    setExamination("");

    if (!className || !academicYear) return;

    const controller = new AbortController();

    async function loadExaminations() {
      setLoadingExaminations(true);

      try {
        const params = new URLSearchParams({
          className,
          academicYear,
        });

        const response = await fetch(
          `/api/exam-results/examinations?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const data: ApiResponse<Examination> = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load examinations."
          );
        }

        const availableExaminations = data.examinations ?? [];
        setExaminations(availableExaminations);

        if (availableExaminations.length === 0) {
          setExamError(
            "No published examinations are available for this class and academic year."
          );
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        setExamError(
          err instanceof Error
            ? err.message
            : "Unable to load examinations."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingExaminations(false);
        }
      }
    }

    void loadExaminations();

    return () => controller.abort();
  }, [academicYear, className]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setResult(null);
    setError("");

    if (!className || !examination || !rollNumber.trim()) {
      setError(
        "Please select your class and examination, and enter your roll number."
      );
      return;
    }

    if (!selectedExamination) {
      setError("Please select a valid examination.");
      return;
    }

    setLoadingResult(true);

    try {
      const params = new URLSearchParams({
        academicYear,
        className,
        rollNumber: rollNumber.trim(),
      });

      if (selectedExamination.examinationKey) {
        params.set("examinationKey", selectedExamination.examinationKey);
      } else {
        params.set(
          "examinationName",
          selectedExamination.examinationName
        );
      }

      const response = await fetch(
        `/api/exam-results/lookup?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data: ApiResponse<ExamResult> = await response.json();

      if (!response.ok || !data.success || !data.result) {
        throw new Error(data.message || "Unable to find your result.");
      }

      setResult(data.result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoadingResult(false);
    }
  }

  function handleReset() {
    setResult(null);
    setError("");
    setRollNumber("");
  }

  const formatMarks = (value: number) =>
    Number.isFinite(value) ? value.toLocaleString("en-IN") : "—";

  const percentage = Number(result?.percentage ?? 0);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
            De-Paul Senior Secondary School
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Examination Results
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
            Select your academic year, class and examination, then enter
            your roll number to view your published result.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="academicYear"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Academic Year
                </label>

                <select
                  id="academicYear"
                  value={academicYear}
                  onChange={(event) => {
                    setAcademicYear(event.target.value);
                    setResult(null);
                    setError("");
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  required
                >
                  {ACADEMIC_YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="className"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Class
                </label>

                <select
                  id="className"
                  value={className}
                  onChange={(event) => {
                    setClassName(event.target.value);
                    setResult(null);
                    setError("");
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  required
                >
                  <option value="">Select class</option>

                  {SCHOOL_CLASSES.map((schoolClass) => (
                    <option
                      key={schoolClass.value}
                      value={schoolClass.value}
                    >
                      {schoolClass.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="examination"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Examination
                </label>

                <select
                  id="examination"
                  value={examination}
                  onChange={(event) => {
                    setExamination(event.target.value);
                    setResult(null);
                    setError("");
                  }}
                  disabled={!className || loadingExaminations}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  required
                >
                  <option value="">
                    {loadingExaminations
                      ? "Loading examinations..."
                      : "Select examination"}
                  </option>

                  {examinations.map((exam, index) => {
                    const value =
                      exam.examinationKey || exam.examinationName;

                    return (
                      <option key={`${value}-${index}`} value={value}>
                        {exam.examinationName}
                      </option>
                    );
                  })}
                </select>

                {examError && (
                  <p className="mt-2 text-xs leading-5 text-amber-700">
                    {examError}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="rollNumber"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Roll Number
                </label>

                <input
                  id="rollNumber"
                  type="text"
                  value={rollNumber}
                  onChange={(event) => {
                    setRollNumber(event.target.value);
                    setResult(null);
                    setError("");
                  }}
                  placeholder="Enter your roll number"
                  autoComplete="off"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-1 sm:flex-row">
              <button
                type="submit"
                disabled={loadingResult || loadingExaminations}
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingResult ? "Checking result..." : "View Result"}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Reset
              </button>
            </div>
          </form>
        </section>

        {result && (
          <section
            aria-live="polite"
            className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="border-b border-slate-200 bg-slate-900 px-5 py-6 text-white sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                Student Result
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                {result.studentName}
              </h2>

              <p className="mt-2 text-sm text-slate-300">
                {result.examinationName} · {result.academicYear}
              </p>
            </div>

            <div className="grid gap-4 border-b border-slate-200 p-5 sm:grid-cols-3 sm:p-8">
              <SummaryItem
                label="Roll Number"
                value={result.rollNumber}
              />
              <SummaryItem
                label="Class"
                value={
                  SCHOOL_CLASSES.find(
                    (item) => item.value === result.className
                  )?.label ?? result.className
                }
              />
              <SummaryItem
                label="Academic Year"
                value={result.academicYear}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4 sm:p-8">
              <SummaryItem
                label="Marks Obtained"
                value={formatMarks(result.totalMarks)}
              />
              <SummaryItem
                label="Maximum Marks"
                value={formatMarks(result.maximumMarks)}
              />
              <SummaryItem
                label="Percentage"
                value={`${percentage.toFixed(2)}%`}
              />
              <SummaryItem
                label="Final Grade"
                value={
                  result.finalGrade ||
                  result.automaticGrade ||
                  "—"
                }
              />
            </div>

            <div className="px-5 pb-6 sm:px-8">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-bold">Subject-wise Marks</h3>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    result.resultStatus === "Pass"
                      ? "bg-green-100 text-green-800"
                      : result.resultStatus === "Fail"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {result.resultStatus}
                </span>
              </div>

              {result.subjects?.length ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Subject</th>
                        <th className="px-4 py-3 text-right font-semibold">
                          Maximum
                        </th>
                        <th className="px-4 py-3 text-right font-semibold">
                          Obtained
                        </th>
                        <th className="px-4 py-3 text-center font-semibold">
                          Grade
                        </th>
                        <th className="px-4 py-3 text-center font-semibold">
                          Remarks
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {result.subjects.map((subject, index) => (
                        <tr
                          key={`${subject.subject}-${index}`}
                          className="hover:bg-slate-50"
                        >
                          <td className="px-4 py-4 font-medium text-slate-800">
                            {subject.subject}
                          </td>
                          <td className="px-4 py-4 text-right text-slate-600">
                            {formatMarks(subject.maxMarks)}
                          </td>
                          <td className="px-4 py-4 text-right font-semibold text-slate-900">
                            {formatMarks(subject.marksObtained)}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {subject.grade || "—"}
                          </td>
                          <td className="px-4 py-4 text-center text-slate-600">
                            {subject.remarks || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-600">
                  Subject-wise marks are not available for this result.
                </p>
              )}

              <p className="mt-5 text-xs leading-5 text-slate-500">
                For any discrepancy in the displayed result, please contact
                the school office.
              </p>
            </div>
          </section>
        )}

        <footer className="mt-8 text-center text-xs leading-5 text-slate-500">
          © {new Date().getFullYear()} De-Paul Senior Secondary School.
          All rights reserved.
        </footer>
      </div>
    </main>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 break-words text-base font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}
