"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

type CampusFacility = {
  id: string;
  slug: string;
  photoCategory: string;
  title: string;
  description: string;
  icon: string;
  sortOrder: number;
  published: boolean;
};

type FacilityForm = Omit<
  CampusFacility,
  "id" | "slug" | "photoCategory"
>;

const emptyForm = (): FacilityForm => ({
  title: "",
  description: "",
  icon: "🏫",
  sortOrder: 0,
  published: true,
});

export default function AdminFacilitiesPage() {
  const [facilities, setFacilities] = useState<CampusFacility[]>([]);
  const [form, setForm] = useState<FacilityForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadFacilities = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/campus-facilities", {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to load campus facilities.");
      }
      setFacilities(
        Array.isArray(data.facilities) ? data.facilities : [],
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load campus facilities.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load server data after mount; state updates happen after the fetch resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadFacilities();
  }, [loadFacilities]);

  function resetForm() {
    setForm(emptyForm());
    setEditingId(null);
  }

  function editFacility(facility: CampusFacility) {
    setEditingId(facility.id);
    setForm({
      title: facility.title,
      description: facility.description,
      icon: facility.icon,
      sortOrder: facility.sortOrder,
      published: facility.published,
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
      const response = await fetch("/api/admin/campus-facilities", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          sortOrder: Number(form.sortOrder),
          ...(editingId ? { id: editingId } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to save campus facility.");
      }

      setMessage(
        editingId ? "Facility updated." : "Facility created.",
      );
      resetForm();
      await loadFacilities();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save facility.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteFacility(facility: CampusFacility) {
    if (
      !window.confirm(
        `Delete "${facility.title}" and all photos uploaded for it? This cannot be undone.`,
      )
    ) {
      return;
    }

    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `/api/admin/campus-facilities?id=${encodeURIComponent(facility.id)}`,
        { method: "DELETE" },
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to delete facility.");
      }
      if (editingId === facility.id) resetForm();
      setMessage(
        data.warning ||
          "Facility and its uploaded photos were deleted.",
      );
      await loadFacilities();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to delete facility.",
      );
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
            School administration
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Campus Facilities
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Create and organize the facility cards shown on the public website.
            Photos are optional; add them now or later from Gallery Management.
          </p>
        </div>
        <Link
          href="/facilities"
          target="_blank"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
        >
          Preview Facilities ↗
        </Link>
      </header>

      {(error || message) && (
        <div
          role={error ? "alert" : "status"}
          className={`rounded-xl border p-4 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          {error || message}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
              {editingId ? "Edit facility" : "New facility"}
            </p>
            <h2 className="mt-1 text-xl font-bold">
              {editingId ? "Update facility details" : "Create a facility card"}
            </h2>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border px-3 py-2 text-sm font-semibold"
            >
              Cancel edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Facility name
            <input
              required
              maxLength={100}
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              placeholder="e.g. Computer Laboratory"
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal"
            />
          </label>

          <label className="text-sm font-semibold">
            Icon or emoji
            <input
              maxLength={16}
              value={form.icon}
              onChange={(event) =>
                setForm({ ...form, icon: event.target.value })
              }
              placeholder="e.g. 💻"
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal"
            />
          </label>

          <label className="text-sm font-semibold md:col-span-2">
            Description
            <textarea
              maxLength={1000}
              rows={3}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              placeholder="Describe this facility. You can add photos later."
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal"
            />
          </label>

          <label className="text-sm font-semibold">
            Display order
            <input
              required
              type="number"
              min={0}
              max={10000}
              step={1}
              value={form.sortOrder}
              onChange={(event) =>
                setForm({ ...form, sortOrder: Number(event.target.value) })
              }
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal"
            />
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(event) =>
                setForm({ ...form, published: event.target.checked })
              }
              className="h-4 w-4 accent-amber-500"
            />
            Show on the public website
          </label>

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button
              disabled={saving}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {saving
                ? "Saving…"
                : editingId
                  ? "Save changes"
                  : "Create facility"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={resetForm}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold hover:bg-slate-50 disabled:opacity-50"
            >
              Clear form
            </button>
          </div>
        </form>

        <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          To upload or manage photos, open{" "}
          <Link
            href="/admin/dashboard/gallery"
            className="font-bold text-blue-700 underline"
          >
            Gallery Management
          </Link>{" "}
          and select this facility under “Event / Campus Section.”
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">All facilities</h2>
            <p className="mt-1 text-sm text-slate-600">
              {facilities.length} total ·{" "}
              {facilities.filter((facility) => facility.published).length} shown
              publicly
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadFacilities()}
            disabled={loading}
            className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Loading facilities…
          </p>
        ) : facilities.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No campus facilities have been created.
          </p>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {facilities.map((facility) => (
              <article
                key={facility.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden="true">
                    {facility.icon || "🏫"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900">
                        {facility.title}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          facility.published
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {facility.published ? "Published" : "Hidden"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {facility.description || "No description"}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Display order: {facility.sortOrder}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => editFacility(facility)}
                        className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteFacility(facility)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
