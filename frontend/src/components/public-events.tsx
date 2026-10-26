
"use client";

import { useEffect, useState } from "react";

type PublicEvent = {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  venue: string;
  imageUrl: string;
  status: "Upcoming" | "Completed";
};

function formatDate(date: string) {
  const value = new Date(`${date}T00:00:00`);

  return Number.isNaN(value.getTime())
    ? date
    : value.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

export function PublicEvents({ limit }: { limit?: number }) {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError("");

        const query = limit
          ? `?limit=${encodeURIComponent(String(limit))}`
          : "";

        const response = await fetch(`/api/events${query}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Unable to load events.");
        }

        setEvents(Array.isArray(data.events) ? data.events : []);
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load events.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [limit]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-5 text-sm text-slate-500">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        Loading school events...
      </div>
    );
  }

  if (error) {
    return (
      <p role="status" className="py-5 text-sm text-slate-500">
        Events are temporarily unavailable.
      </p>
    );
  }

  if (!events.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
        No published events at the moment. Please check again soon.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4">
      {events.map((event) => (
        <article
          key={event.id}
          className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-amber-200 hover:shadow-md sm:flex-row"
        >
          {/* Compact Event Image */}
          <div className="relative h-28 w-full shrink-0 overflow-hidden bg-gradient-to-br from-slate-900 to-slate-700 sm:h-auto sm:min-h-32 sm:w-40 lg:w-48">
            {event.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={event.imageUrl}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full min-h-28 items-center justify-center px-3 text-center sm:min-h-32">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">
                  De-Paul School · Events
                </span>
              </div>
            )}
          </div>

          {/* Event Information */}
          <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
            {/* Status and Date */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  event.status === "Upcoming"
                    ? "bg-amber-50 text-amber-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {event.status}
              </span>

              <time
                dateTime={event.eventDate}
                className="text-[11px] text-slate-500 sm:text-xs"
              >
                {formatDate(event.eventDate)}
              </time>
            </div>

            {/* Event Title */}
            <h2 className="mt-2 line-clamp-2 text-base font-bold leading-snug tracking-tight text-slate-900 sm:text-lg">
              {event.title}
            </h2>

            {/* Event Description */}
            {event.description && (
              <p className="mt-1.5 line-clamp-2 whitespace-pre-line text-xs leading-5 text-slate-600 sm:text-sm">
                {event.description}
              </p>
            )}

            {/* Venue */}
            {event.venue && (
              <div className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-slate-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"
                  />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>

                <p className="min-w-0 break-words">
                  <span className="font-semibold text-slate-800">
                    Venue:
                  </span>{" "}
                  {event.venue}
                </p>
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
