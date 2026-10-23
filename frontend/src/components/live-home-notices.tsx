
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Notice = {
  _id: string;
  title: string;
  description: string;
  date: string;
  pdfUrl?: string;
  published: boolean;
  isLatest?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type NoticeApiResponse = {
  success: boolean;
  notices: Notice[];
};

function getTimestamp(notice: Notice): number {
  const dateValue = new Date(notice.date).getTime();

  if (Number.isFinite(dateValue)) {
    return dateValue;
  }

  const createdValue = notice.createdAt
    ? new Date(notice.createdAt).getTime()
    : 0;

  return Number.isFinite(createdValue) ? createdValue : 0;
}

function sortByDate(a: Notice, b: Notice): number {
  return (
    getTimestamp(b) - getTimestamp(a) ||
    (new Date(b.createdAt ?? 0).getTime() -
      new Date(a.createdAt ?? 0).getTime())
  );
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function LiveHomeNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadNotices = useCallback(async () => {
    try {
      const response = await fetch("/api/notices", {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load notices: ${response.status}`);
      }

      const data: NoticeApiResponse = await response.json();

      if (!data.success || !Array.isArray(data.notices)) {
        throw new Error("Invalid notices API response.");
      }

      const publishedNotices = data.notices
        .filter((notice) => notice.published === true)
        .sort(sortByDate);

      setNotices(publishedNotices);
      setError(false);
    } catch (err) {
      console.error("Homepage notices error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotices();

    const interval = window.setInterval(() => {
      void loadNotices();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [loadNotices]);

  // All selected Latest notices appear first.
  const latestNotices = notices.filter(
    (notice) => notice.isLatest === true
  );

  const regularNotices = notices.filter(
    (notice) => notice.isLatest !== true
  );

  function renderNotice(notice: Notice, isLatest: boolean) {
    return (
      <article
        key={notice._id}
        className={`relative overflow-hidden rounded-xl border p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6 ${
          isLatest
            ? "border-amber-300 bg-amber-50/60 shadow-sm"
            : "border-slate-200 bg-white"
        }`}
      >
        {isLatest && (
          <div className="absolute inset-y-0 left-0 w-1 bg-amber-400" />
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-500">
            {formatDate(notice.date)}
          </span>

          {isLatest && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10284b] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Latest
            </span>
          )}
        </div>

        <h3
          className={`mt-4 break-words text-lg font-extrabold leading-snug ${
            isLatest ? "text-[#10284b]" : "text-slate-800"
          }`}
        >
          {notice.title}
        </h3>

        <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-600">
          {notice.description}
        </p>

        {notice.pdfUrl && (
          <a
            href={notice.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#10284b] transition hover:text-amber-700"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3"
              />
            </svg>
            View Notice / PDF
          </a>
        )}
      </article>
    );
  }

  return (
    <section
      id="latest-notice"
      className="bg-slate-50 px-4 py-12 sm:px-6 sm:py-16"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-600">
              De-Paul Senior Secondary School
            </p>

            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#10284b] sm:text-4xl">
              Latest Notices
            </h2>

            <div className="mt-3 h-1 w-16 rounded-full bg-amber-400" />
          </div>

          <Link
            href="/notices"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#10284b] transition hover:text-amber-700"
          >
            View All Notices <span aria-hidden="true">→</span>
          </Link>
        </div>

        {loading ? (
          <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-6">
            <div className="h-5 w-48 rounded bg-slate-200" />
            <div className="mt-4 h-4 w-3/4 rounded bg-slate-100" />
          </div>
        ) : error && notices.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
            <p className="text-sm text-slate-600">
              Notices could not be loaded right now.
            </p>

            <button
              type="button"
              onClick={() => {
                setLoading(true);
                void loadNotices();
              }}
              className="mt-4 rounded-lg bg-[#10284b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#183963]"
            >
              Try Again
            </button>
          </div>
        ) : notices.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <p className="font-semibold text-slate-700">
              No published notices available.
            </p>
          </div>
        ) : (
          <>
            {latestNotices.length > 0 && (
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <span className="h-6 w-1 rounded-full bg-amber-400" />
                  <h3 className="text-lg font-extrabold text-[#10284b]">
                    Important & Latest
                  </h3>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                    {latestNotices.length}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {latestNotices.map((notice) =>
                    renderNotice(notice, true)
                  )}
                </div>
              </div>
            )}

            {regularNotices.length > 0 && (
              <div className={latestNotices.length > 0 ? "mt-10" : ""}>
                <h3 className="mb-4 text-lg font-extrabold text-[#10284b]">
                  Previous Notices
                </h3>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {regularNotices.map((notice) =>
                    renderNotice(notice, false)
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/notices"
            className="inline-flex items-center justify-center rounded-lg border border-[#10284b] px-6 py-3 text-sm font-bold text-[#10284b] transition hover:bg-[#10284b] hover:text-white"
          >
            View All Notices <span className="ml-2">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}