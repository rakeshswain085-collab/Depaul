
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
};

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotices = useCallback(async () => {
    try {
      const response = await fetch("/api/notices", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Unable to load notices (${response.status})`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Unable to load notices.");
      }

      setNotices(data.notices ?? []);
      setError("");
    } catch (err) {
      console.error("Notice loading error:", err);
      setError("Unable to load notices. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadNotices();
    }, 0);

    // Automatically refresh notices every 30 seconds.
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadNotices();
      }
    }, 30_000);

    // Refresh when the visitor returns to this tab.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadNotices();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [loadNotices]);

  const formatDate = (date: string) => {
    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <main className="min-h-screen bg-[#f5f8fc]">
      {/* =========================================
          HERO SECTION — GALLERY PAGE STYLE
      ========================================== */}
      <section className="relative isolate overflow-hidden bg-[#10264b]">
        {/* Background decoration */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-amber-400/5 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-[72px]">
          <div className="max-w-3xl animate-fade-up">
            {/* Breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              className="mb-5 text-xs font-extrabold uppercase tracking-[0.22em] text-amber-400 sm:text-sm"
            >
              <Link
                href="/"
                className="transition-colors hover:text-white"
              >
                Home
              </Link>

              <span className="mx-2 text-amber-400/60">/</span>

              <span aria-current="page">Notice</span>
            </nav>

            {/* Main heading */}
            <h1 className="text-3xl font-extrabold uppercase leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
              Notices &amp; Announcements
            </h1>

            {/* Yellow underline */}
            <div
              aria-hidden="true"
              className="mt-5 h-1 w-20 rounded-full bg-amber-400 transition-all duration-500 hover:w-28"
            />

            {/* Description */}
            <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-100/90 sm:text-base sm:leading-8">
              Stay informed about examinations, school activities,
              important announcements and updates.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================
          NOTICES CONTENT
      ========================================== */}
      <section className="bg-[#f5f8fc]">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
          {/* Section heading */}
          <div className="mb-7 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-blue-800 sm:text-sm">
                Stay Updated
              </p>

              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#10264b] sm:text-3xl">
                Latest School Notices
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Important announcements, updates and information
                for students and parents.
              </p>
            </div>

            {!loading && !error && (
              <div className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-amber-400" />

                {notices.length}{" "}
                {notices.length === 1 ? "notice" : "notices"}
              </div>
            )}
          </div>

          {/* Loading state */}
          {loading ? (
            <div
              role="status"
              aria-live="polite"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center shadow-sm sm:py-16"
            >
              <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-amber-400" />

              <p className="mt-4 text-sm font-medium text-slate-600">
                Loading school notices...
              </p>
            </div>
          ) : error ? (
            /* Error state */
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm sm:p-8"
            >
              <h3 className="text-lg font-bold text-[#10264b]">
                Unable to load notices
              </h3>

              <p className="mt-2 text-sm leading-6 text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  void loadNotices();
                }}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#10264b] px-5 py-3 text-sm font-bold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#193b6b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
              >
                Try Again
              </button>
            </div>
          ) : notices.length === 0 ? (
            /* Empty state */
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center sm:py-16">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl text-amber-700">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className="h-7 w-7"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 3.75h7l5 5v11.5a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2.5Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14 3.75v5h5M8.5 13h7M8.5 16.5h7"
                  />
                </svg>
              </div>

              <h3 className="mt-5 text-xl font-extrabold text-[#10264b]">
                No notices available
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">
                There are no published announcements at the moment.
                Please check back later for school updates.
              </p>
            </div>
          ) : (
            /* Notice cards */
            <div className="grid grid-cols-1 gap-4 sm:gap-5">
              {notices.map((notice, index) => (
                <article
                  key={notice._id}
                  className="group relative animate-fade-up overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg sm:p-6"
                  style={{
                    animationDelay: `${Math.min(index * 70, 350)}ms`,
                  }}
                >
                  {/* Left accent */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-1 bg-amber-400 transition-all duration-300 group-hover:w-1.5"
                  />

                  <div className="flex min-w-0 flex-col gap-4 pl-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      {/* Category and date */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                          School Notice
                        </span>

                        <time
                          dateTime={notice.date}
                          className="text-sm text-slate-500"
                        >
                          {formatDate(notice.date)}
                        </time>
                      </div>

                      {/* Notice title */}
                      <h3 className="mt-4 break-words text-lg font-bold tracking-tight text-[#10264b] transition-colors duration-300 group-hover:text-blue-800 sm:text-xl">
                        {notice.title}
                      </h3>

                      {/* Notice description */}
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600 sm:text-base">
                        {notice.description}
                      </p>
                    </div>

                    {/* PDF button */}
                    {notice.pdfUrl && (
                      <a
                        href={notice.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View PDF for ${notice.title}`}
                        className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#10264b] transition-all duration-300 hover:border-amber-400 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 sm:w-auto"
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-4 w-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M7 3.75h7l5 5v11.5a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2.5Z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14 3.75v5h5M8.5 13h7M8.5 16.5h4"
                          />
                        </svg>

                        View PDF

                        <span aria-hidden="true">↗</span>
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Footer note */}
          {!loading && !error && notices.length > 0 && (
            <p className="mt-8 text-center text-xs leading-6 text-slate-400 sm:mt-10 sm:text-sm">
              Notices are updated automatically.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
