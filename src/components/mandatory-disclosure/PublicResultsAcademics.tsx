
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AcademicRecord = {
  title?: string;
  description?: string;
  fileId?: string;
  fileName?: string;
  published?: boolean;
  academicYear?: string;
};

type ContentResponse = {
  success?: boolean;
  data?: {
    resultsAndAcademics?: {
      records?: AcademicRecord[];
    } | null;
  } | null;
  message?: string;
};

export default function PublicResultsAcademics() {
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadRecords() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/mandatory-disclosure/content", {
          cache: "no-store",
          signal: controller.signal,
        });

        const result = (await response.json()) as ContentResponse;

        if (!response.ok || result.success === false) {
          throw new Error(result.message || "Unable to load academic records.");
        }

        const savedRecords =
          result.data?.resultsAndAcademics?.records ?? [];

        setRecords(
          savedRecords.filter(
            (record) =>
              record.published === true &&
              typeof record.fileId === "string" &&
              record.fileId.trim().length > 0,
          ),
        );
      } catch (cause) {
        if (cause instanceof Error && cause.name === "AbortError") return;

        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load academic records.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadRecords();
    return () => controller.abort();
  }, []);

  const documentHref = (fileId: string) =>
    `/api/mandatory-disclosure/file/${encodeURIComponent(fileId)}`;

  return (
    <div className="space-y-6">
       {/* Student examination results */}
      <Link
        href="/results"
        className="group flex items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-amber-300 hover:shadow-md sm:p-6"
      >
        <span className="flex min-w-0 items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8l-5-5H8Z" />
              <path d="M16 3v5h5M7 13h10M7 17h7" />
            </svg>
          </span>

          <span className="min-w-0">
            <span className="block text-base font-bold text-[#10264b]">
              Examination Results
            </span>
            <span className="mt-1 block text-sm leading-6 text-slate-500">
              Check your examination marks using your academic year, class,
              examination and roll number.
            </span>
            <span className="mt-2 block text-sm font-semibold text-amber-700">
              View Student Results →
            </span>
          </span>
        </span>
      </Link>
      {/* Academic document cards */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Loading academic records…
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
        >
          {error}
        </div>
      ) : records.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {records.map((record, index) => (
            <a
              key={`${record.fileId}-${index}`}
              href={documentHref(record.fileId!)}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-[112px] items-center gap-5 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md sm:px-6"
            >
              {/* Number badge */}
              <span className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-2xl bg-[#eef3fb] text-xl font-bold text-[#10264b]">
                {String(index + 1).padStart(2, "0")}
              </span>

              {/* Title and description */}
              <span className="min-w-0 flex-1">
                <span className="block break-words text-base font-bold leading-6 text-[#10264b] transition-colors group-hover:text-amber-700">
                  {record.title?.trim() ||
                    record.fileName?.trim() ||
                    `Academic Record ${index + 1}`}
                </span>

                {record.description && (
                  <span className="mt-1 block text-sm leading-5 text-slate-500">
                    {record.description}
                  </span>
                )}

                {record.academicYear && (
                  <span className="mt-1 block text-xs text-slate-400">
                    Academic year: {record.academicYear}
                  </span>
                )}
              </span>

              {/* Right arrow */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-6 w-6 shrink-0 text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-amber-600"
                aria-hidden="true"
              >
                <path
                  d="M5 12h14m-6-6 6 6-6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
          <p className="text-sm font-semibold text-slate-700">
            No published academic records available.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Upload a PDF, enable “Publish this academic record,” and save your
            changes in the administration panel.
          </p>
        </div>
      )}

     
    </div>
  );
}
