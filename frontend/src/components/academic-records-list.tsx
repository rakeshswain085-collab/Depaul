
"use client";

import { useEffect, useState } from "react";

type AcademicRecord = {
  title: string;
  description?: string;
  academicYear?: string;
  fileId: string;
  fileName?: string;
  published: boolean;
};

export default function AcademicRecordsList() {
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadRecords() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/mandatory-disclosure/content", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load academic records.");
        }

        const result = await response.json();

        // Supports common API response shapes.
        const content =
          result?.data?.content ??
          result?.data ??
          result?.content ??
          result;

        const savedRecords =
          content?.resultsAndAcademics?.records ??
          content?.data?.resultsAndAcademics?.records ??
          [];

        if (!Array.isArray(savedRecords)) {
          throw new Error("The academic records response has an unexpected format.");
        }

        const publishedRecords = savedRecords.filter(
          (record: AcademicRecord) =>
            record.published === true &&
            typeof record.fileId === "string" &&
            record.fileId.trim().length > 0
        );

        if (!cancelled) {
          setRecords(publishedRecords);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong while loading records."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRecords();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="w-full">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
          Academic Records
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Results &amp; Academics
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          View published examination results and other academic documents
          from De-Paul Senior Secondary School.
        </p>
      </div>

      {loading && (
        <div className="rounded-2xl border border-slate-200 p-6 text-sm text-slate-600">
          Loading academic records…
        </div>
      )}

      {!loading && error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {!loading && !error && records.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
          <h3 className="font-semibold text-slate-900">
            No results published yet
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Published examination results and academic documents will appear
            here when they are made available by the school.
          </p>
        </div>
      )}

      {!loading && !error && records.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {records.map((record, index) => (
            <article
              key={`${record.fileId}-${index}`}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
            >
              <div>
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-6 w-6"
                    >
                      <path
                        d="M7 3.75h7l4 4v12.5H7a2 2 0 0 1-2-2v-12.5a2 2 0 0 1 2-2Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M14 3.75v4h4M8.5 13h6M8.5 16.5h6"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold leading-6 text-slate-900">
                      {record.title}
                    </h3>

                    {record.academicYear && (
                      <p className="mt-1 text-xs font-medium text-amber-800">
                        Academic Year: {record.academicYear}
                      </p>
                    )}
                  </div>
                </div>

                {record.description && (
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {record.description}
                  </p>
                )}
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <a
                  href={`/api/mandatory-disclosure/file/${encodeURIComponent(
                    record.fileId
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                >
                  View Results / PDF
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-4 w-4"
                  >
                    <path
                      d="M14 5h5v5M19 5l-9 9M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>

                {record.fileName && (
                  <p className="mt-2 break-all text-xs text-slate-500">
                    {record.fileName}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
