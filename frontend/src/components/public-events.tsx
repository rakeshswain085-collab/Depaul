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
    : value.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

export function PublicEvents({ limit }: { limit?: number }) {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const query = limit ? `?limit=${encodeURIComponent(String(limit))}` : "";
        const response = await fetch(`/api/events${query}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Unable to load events.");
        setEvents(Array.isArray(data.events) ? data.events : []);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Unable to load events.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [limit]);

  if (loading) return <p className="py-8 text-sm text-slate-500">Loading school events…</p>;
  if (error) return <p role="status" className="py-8 text-sm text-slate-500">Events are temporarily unavailable.</p>;
  if (!events.length) return <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No published events at the moment. Please check again soon.</div>;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <article key={event.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
          {event.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.imageUrl} alt="" loading="lazy" className="h-52 w-full object-cover transition duration-500 group-hover:scale-[1.02]" />
          ) : (
            <div className="flex h-40 items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-amber-300">
              <span className="text-xs font-bold uppercase tracking-[0.25em]">De-Paul School · Events</span>
            </div>
          )}
          <div className="p-5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">{event.status}</span>
              <time dateTime={event.eventDate} className="text-slate-500">{formatDate(event.eventDate)}</time>
            </div>
            <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-900">{event.title}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{event.description}</p>
            <p className="mt-4 border-t border-slate-100 pt-3 text-sm font-semibold text-slate-700">
              <span className="mr-2 text-amber-600">Venue</span>{event.venue}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
