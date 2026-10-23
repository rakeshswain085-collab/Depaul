 "use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

type SchoolEvent = {
  _id: string;
  title: string;
  description: string;
  eventDate: string;
  venue: string;
  imageUrl: string;
  status: "Upcoming" | "Completed";
  published: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type EventForm = Omit<SchoolEvent, "_id" | "createdAt" | "updatedAt">;

const emptyForm = (): EventForm => ({
  title: "",
  description: "",
  eventDate: new Date().toISOString().slice(0, 10),
  venue: "",
  imageUrl: "",
  status: "Upcoming",
  published: false,
});

export default function AdminEventsPage() {
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/events", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to load events.");
      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadEvents(); }, [loadEvents]);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return events.filter((event) =>
      !query ||
      event.title.toLowerCase().includes(query) ||
      event.description.toLowerCase().includes(query) ||
      event.venue.toLowerCase().includes(query)
    );
  }, [events, search]);

  function resetForm() {
    setForm(emptyForm());
    setEditingId(null);
  }

  function editEvent(event: SchoolEvent) {
    setEditingId(event._id);
    setForm({
      title: event.title,
      description: event.description,
      eventDate: event.eventDate,
      venue: event.venue,
      imageUrl: event.imageUrl || "",
      status: event.status,
      published: event.published,
    });
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/events", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...(editingId ? { id: editingId } : {}) }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to save event.");

      setMessage(editingId ? "Event updated successfully." : "Event created successfully.");
      resetForm();
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save event.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(event: SchoolEvent) {
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: event._id, published: !event.published }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to change publication status.");
      setMessage(!event.published ? "Event published on the public website." : "Event unpublished from the public website.");
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update publication status.");
    }
  }

  async function deleteEvent(event: SchoolEvent) {
    if (!window.confirm(`Delete "${event.title}" permanently? This cannot be undone.`)) return;
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/events?id=${encodeURIComponent(event._id)}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to delete event.");
      if (editingId === event._id) resetForm();
      setMessage("Event deleted successfully.");
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete event.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">School administration</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Events Management</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Create and manage school events. Only published events appear on the public website.</p>
          </div>
          <a href="/events" target="_blank" rel="noreferrer" className="inline-flex w-fit rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-100">Preview public events ↗</a>
        </header>

        {(error || message) && (
          <div role="status" className={`whitespace-pre-wrap rounded-xl border p-4 text-sm ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>
            {error || message}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">{editingId ? "Edit event" : "New event"}</p>
              <h2 className="mt-1 text-xl font-bold">{editingId ? "Update event details" : "Add a school event"}</h2>
            </div>
            {editingId && <button type="button" onClick={resetForm} className="rounded-lg border px-3 py-2 text-sm font-semibold">Cancel edit</button>}
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold">Event title
              <input required maxLength={160} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal" placeholder="e.g. Annual Function" />
            </label>
            <label className="text-sm font-semibold">Event date
              <input required type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal" />
            </label>
            <label className="text-sm font-semibold">Venue
              <input required maxLength={250} value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal" placeholder="e.g. School Auditorium" />
            </label>
            <label className="text-sm font-semibold">Image URL (optional)
              <input type="text" maxLength={1000} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal" placeholder="/images/events/annual-function.jpg" />
            </label>
            <label className="text-sm font-semibold md:col-span-2">Description
              <textarea required maxLength={5000} rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal" placeholder="Describe the event for students and parents." />
            </label>
            <label className="text-sm font-semibold">Event status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as EventForm["status"] })} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal">
                <option value="Upcoming">Upcoming</option>
                <option value="Completed">Completed</option>
              </select>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="h-4 w-4 accent-amber-500" />
              Publish immediately after saving
            </label>
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button disabled={saving} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50">{saving ? "Saving…" : editingId ? "Save changes" : "Create event"}</button>
              <button type="button" disabled={saving} onClick={resetForm} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold hover:bg-slate-50 disabled:opacity-50">Clear form</button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">All events</h2>
              <p className="mt-1 text-sm text-slate-600">{events.length} total · {events.filter((event) => event.published).length} published</p>
            </div>
            <div className="flex gap-2">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events…" className="min-w-0 rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <button type="button" onClick={() => void loadEvents()} disabled={loading} className="rounded-xl border px-3 py-2 text-sm font-semibold disabled:opacity-50">Refresh</button>
            </div>
          </div>

          {loading ? <p className="py-10 text-center text-sm text-slate-500">Loading events…</p> : filteredEvents.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed p-10 text-center text-sm text-slate-500">No events found. Add your first event above.</div>
          ) : (
            <div className="mt-5 space-y-3">
              {filteredEvents.map((event) => (
                <article key={event._id} className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">{event.title}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${event.published ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{event.published ? "Published" : "Draft"}</span>
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">{event.status}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{new Date(`${event.eventDate}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} · {event.venue}</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{event.description}</p>
                    {event.imageUrl && <p className="mt-1 break-all text-xs text-slate-400">{event.imageUrl}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <button type="button" onClick={() => editEvent(event)} className="rounded-lg border px-3 py-2 text-xs font-bold hover:bg-slate-50">Edit</button>
                    <button type="button" onClick={() => void togglePublished(event)} className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50">{event.published ? "Unpublish" : "Publish"}</button>
                    <button type="button" onClick={() => void deleteEvent(event)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50">Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
