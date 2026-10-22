"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const CATEGORIES = ["PGT Teachers", "TGT Teachers", "PRT Teachers"] as const;
type Category = (typeof CATEGORIES)[number];
type Staff = {
  _id: string; name: string; designation: string; subject: string;
  category: Category; photoId: string; photoUrl: string;
  published: boolean; sortOrder: number; createdAt: string; updatedAt: string;
};

const blankForm = {
  name: "", designation: "", subject: "", category: "PGT Teachers" as Category,
  photoId: "", published: true, sortOrder: 0,
};

export default function StaffInformationAdminPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [category, setCategory] = useState<Category>("PGT Teachers");
  const [form, setForm] = useState({ ...blankForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadStaff = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/staff", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load staff.");
      setStaff(data.staff ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load staff.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadStaff(); }, [loadStaff]);

  useEffect(() => {
    if (!photo) { setPhotoPreview(""); return; }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const visibleStaff = useMemo(
    () => staff.filter((person) => person.category === category).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [staff, category],
  );

  function resetForm(nextCategory: Category = category) {
    setEditingId(null);
    setForm({ ...blankForm, category: nextCategory });
    setPhoto(null);
    setPhotoPreview("");
    setMessage("");
    setError("");
  }

  function editStaff(person: Staff) {
    setEditingId(person._id);
    setCategory(person.category);
    setForm({
      name: person.name, designation: person.designation, subject: person.subject,
      category: person.category, photoId: person.photoId, published: person.published,
      sortOrder: person.sortOrder,
    });
    setPhoto(null);
    setPhotoPreview(person.photoUrl);
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadPhoto() {
    if (!photo) return form.photoId;
    const data = new FormData();
    data.append("file", photo);
    const response = await fetch("/api/staff/upload-photo", { method: "POST", body: data });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Photo upload failed.");
    return result.photoId as string;
  }

  async function saveStaff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    let newlyUploadedPhotoId = "";
    try {
      let photoId = form.photoId;
      if (photo) {
        photoId = await uploadPhoto();
        newlyUploadedPhotoId = photoId;
      }
      const payload = { ...form, photoId };
      const response = await fetch(editingId ? `/api/staff/${editingId}` : "/api/staff", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save staff.");
      setMessage(editingId ? "Teacher updated successfully." : "Teacher added successfully.");
      resetForm(category);
      await loadStaff();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save staff.");
      // If metadata save failed after upload, avoid silently losing track of the photo ID.
      if (newlyUploadedPhotoId) setForm((current) => ({ ...current, photoId: newlyUploadedPhotoId }));
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(person: Staff) {
    setError(""); setMessage("");
    try {
      const response = await fetch(`/api/staff/${person._id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !person.published }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update publishing status.");
      await loadStaff();
    } catch (e) { setError(e instanceof Error ? e.message : "Update failed."); }
  }

  async function deleteStaff(person: Staff) {
    if (!window.confirm(`Delete ${person.name}? This cannot be undone.`)) return;
    setError(""); setMessage("");
    try {
      const response = await fetch(`/api/staff/${person._id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Delete failed.");
      if (editingId === person._id) resetForm(category);
      setMessage("Teacher deleted.");
      await loadStaff();
    } catch (e) { setError(e instanceof Error ? e.message : "Delete failed."); }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-600">School Administration</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Staff Information</h1>
          <p className="mt-2 text-sm text-slate-500">Manage PGT, TGT and PRT teacher profiles shown on the public website.</p>
        </div>

        {(message || error) && (
          <div className={`mb-5 rounded-xl border p-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
            {error || message}
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Teacher Categories</h2>
              <span className="text-xs text-slate-400">{staff.length} total</span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {CATEGORIES.map((item, index) => {
                const count = staff.filter((person) => person.category === item).length;
                const active = category === item;
                return (
                  <button key={item} type="button" onClick={() => { setCategory(item); resetForm(item); }}
                    className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                    <span className="flex items-center gap-3">
                      <span className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-bold ${active ? "bg-white/10 text-amber-300" : "bg-slate-100 text-slate-600"}`}>0{index + 1}</span>
                      <span className="text-sm font-semibold">{item}</span>
                    </span>
                    <span className={`rounded-full px-2 py-1 text-xs ${active ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600"}`}>{count}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={saveStaff} className="mt-6 border-t border-slate-100 pt-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-semibold">{editingId ? "Edit Teacher" : `Add ${category}`}</h2>
                {editingId && <button type="button" onClick={() => resetForm(category)} className="text-xs font-semibold text-slate-500 underline">Cancel edit</button>}
              </div>

              <label className="mb-1 block text-sm font-medium">Teacher Category</label>
              <select value={form.category} onChange={(e) => { const value = e.target.value as Category; setCategory(value); setForm((old) => ({ ...old, category: value })); }}
                className="mb-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500">
                {CATEGORIES.map((item) => <option key={item}>{item}</option>)}
              </select>

              <label className="mb-1 block text-sm font-medium">Teacher Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name"
                className="mb-4 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-500" />

              <label className="mb-1 block text-sm font-medium">Designation *</label>
              <input required value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="e.g. PGT - Chemistry"
                className="mb-4 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-500" />

              <label className="mb-1 block text-sm font-medium">Subject (optional)</label>
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Chemistry"
                className="mb-4 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-500" />

              <label className="mb-1 block text-sm font-medium">Teacher Photo (JPG, PNG, WebP; max 5 MB)</label>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                className="mb-3 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5" />

              {photoPreview && <div className="mb-4 flex items-center gap-3">
                <img src={photoPreview} alt="Teacher preview" className="h-20 w-20 rounded-full border-4 border-white object-cover shadow" />
                <span className="text-xs text-slate-500">{photo ? photo.name : "Current photo"}</span>
              </div>}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Display Order</label>
                  <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
                </div>
                <label className="flex items-center gap-2 self-end pb-3 text-sm">
                  <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="h-4 w-4 rounded" />
                  Publish on website
                </label>
              </div>

              <button disabled={saving} className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                {saving ? "Saving..." : editingId ? "Save Changes" : "Add Teacher"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{category}</h2>
                <p className="mt-1 text-sm text-slate-500">Profiles in this category.</p>
              </div>
              <button type="button" onClick={() => void loadStaff()} className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">Refresh</button>
            </div>

            {loading ? <p className="py-10 text-center text-sm text-slate-500">Loading teachers…</p>
              : visibleStaff.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 px-5 py-12 text-center">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-xl">＋</div>
                <p className="font-medium">No teachers added yet</p>
                <p className="mt-1 text-sm text-slate-500">Use the form to add the first {category.toLowerCase()} record.</p>
              </div>
              : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {visibleStaff.map((person) => (
                  <article key={person._id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="flex justify-center bg-gradient-to-b from-teal-100 to-slate-50 px-4 pt-5">
                      {person.photoUrl ? <img src={person.photoUrl} alt={person.name} className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-sm" />
                        : <div className="grid h-24 w-24 place-items-center rounded-full border-4 border-white bg-slate-100 text-2xl font-bold text-slate-400">{person.name.slice(0, 1).toUpperCase()}</div>}
                    </div>
                    <div className="p-4 text-center">
                      <h3 className="font-semibold">{person.name}</h3>
                      <p className="mt-1 text-xs text-slate-500">{person.designation}{person.subject ? ` · ${person.subject}` : ""}</p>
                      <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${person.published ? "bg-teal-50 text-teal-800" : "bg-amber-50 text-amber-800"}`}>{person.published ? "Published" : "Draft"}</span>
                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <button onClick={() => editStaff(person)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">Edit</button>
                        <button onClick={() => void togglePublished(person)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">{person.published ? "Unpublish" : "Publish"}</button>
                        <button onClick={() => void deleteStaff(person)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Delete</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>}
          </section>
        </div>
      </div>
    </main>
  );
}
