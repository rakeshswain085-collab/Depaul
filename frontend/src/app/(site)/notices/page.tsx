"use client";

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

    // Refresh notices automatically every 30 seconds.
    const interval = window.setInterval(() => {
      void loadNotices();
    }, 30_000);

    // Refresh when the visitor returns to this browser tab.
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
    <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 border-b border-slate-200 pb-6">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
            De-Paul Senior Secondary School
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Notices & Announcements
          </h1>

          <p className="mt-3 text-slate-600">
            Stay informed about examinations, school activities,
            important announcements and updates.
          </p>
        </header>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            Loading notices...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-white p-6">
            <p className="text-red-700">{error}</p>

            <button
              type="button"
              onClick={() => {
                setLoading(true);
                void loadNotices();
              }}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Try again
            </button>
          </div>
        ) : notices.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <h2 className="text-xl font-semibold text-slate-900">
              No notices available
            </h2>
            <p className="mt-2 text-slate-600">
              Please check back later for school announcements.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <article
                key={notice._id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-amber-300 hover:shadow-md sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                        School Notice
                      </span>

                      <time
                        dateTime={notice.date}
                        className="text-sm text-slate-500"
                      >
                        {formatDate(notice.date)}
                      </time>
                    </div>

                    <h2 className="text-xl font-semibold text-slate-900">
                      {notice.title}
                    </h2>

                    <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-600">
                      {notice.description}
                    </p>
                  </div>

                  {notice.pdfUrl && (
                    <a
                      href={notice.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-amber-600 hover:bg-amber-50"
                    >
                      View PDF
                      <span aria-hidden="true">↗</span>
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">
          Notices are updated automatically.
        </p>
      </div>
    </main>
  );
}