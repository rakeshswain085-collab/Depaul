
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Notice = {
  _id: string;
  title: string;
  description: string;
  date: string;
  pdfUrl?: string;
  published: boolean;
  isLatest?: boolean;
  createdAt?: string;
};

type NoticeForm = {
  title: string;
  description: string;
  date: string;
  pdfUrl: string;
  published: boolean;
  isLatest: boolean;
};

const createEmptyForm = (): NoticeForm => ({
  title: "",
  description: "",
  date: new Date().toISOString().slice(0, 10),
  pdfUrl: "",
  published: false,
  isLatest: false,
});

export default function NoticesAdminPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [form, setForm] = useState<NoticeForm>(createEmptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const loadNotices = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/notices", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to load notices.");
      }

      if (!Array.isArray(data.notices)) {
        throw new Error("Invalid notices response.");
      }

      setNotices(data.notices);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load notices."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotices();
  }, [loadNotices]);

  function updateField<K extends keyof NoticeForm>(
    key: K,
    value: NoticeForm[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(createEmptyForm());
    setEditingId(null);
    setError("");
  }

  function startNewNotice() {
    resetForm();
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEditing(notice: Notice) {
    setEditingId(notice._id);

    setForm({
      title: notice.title,
      description: notice.description,
      date: notice.date,
      pdfUrl: notice.pdfUrl || "",
      published: notice.published,
      isLatest: notice.isLatest === true,
    });

    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    if (form.isLatest && !form.published) {
      setError("Publish the notice before selecting it as Latest.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const noticeBeingEdited = editingId;
    const method = noticeBeingEdited ? "PATCH" : "POST";

    try {
      const response = await fetch("/api/admin/notices", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          date: form.date,
          pdfUrl: form.pdfUrl.trim(),
          published: form.published,
          isLatest: form.isLatest,
          ...(noticeBeingEdited ? { id: noticeBeingEdited } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to save notice.");
      }

      setMessage(
        method === "POST"
          ? "Notice created successfully. Previous notices were preserved."
          : "Notice updated successfully."
      );

      setForm(createEmptyForm());
      setEditingId(null);

      await loadNotices();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save notice."
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(notice: Notice) {
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/notices", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: notice._id,
          published: !notice.published,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to change publication status.");
      }

      setMessage(
        !notice.published ? "Notice published." : "Notice unpublished."
      );

      await loadNotices();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to change publication status."
      );
    }
  }

  async function setLatestNotice(notice: Notice) {
    if (!notice.published) {
      setError("Publish this notice before selecting it as Latest.");
      return;
    }

    if (notice.isLatest) {
      setMessage("This notice is already selected as Latest.");
      setError("");
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/notices", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: notice._id,
          isLatest: true,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to select the latest notice.");
      }

      setMessage(`"${notice.title}" is now the Latest Notice.`);
      await loadNotices();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to select the latest notice."
      );
    }
  }

  async function deleteNotice(notice: Notice) {
    const confirmed = window.confirm(
      `Delete "${notice.title}" permanently? This cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/notices?id=${encodeURIComponent(notice._id)}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to delete notice.");
      }

      if (editingId === notice._id) {
        setForm(createEmptyForm());
        setEditingId(null);
      }

      setMessage("Notice deleted successfully.");
      await loadNotices();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete notice."
      );
    }
  }

  const filteredNotices = notices.filter((notice) => {
    const query = search.trim().toLowerCase();

    return (
      !query ||
      notice.title.toLowerCase().includes(query) ||
      notice.description.toLowerCase().includes(query)
    );
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
              School Administration
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Notices Management
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Create announcements, publish notices, and choose which notice
              appears first on the school website.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={startNewNotice}
              className="inline-flex items-center justify-center rounded-xl bg-[#10284b] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#183963]"
            >
              + Create new notice
            </button>

            <button
              type="button"
              onClick={() => void loadNotices()}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-slate-100 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh notices"}
            </button>
          </div>
        </header>

        {(error || message) && (
          <div
            role={error ? "alert" : "status"}
            className={`mb-6 rounded-xl border p-4 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {error || message}
          </div>
        )}

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">
                {editingId ? "Edit notice" : "Create a notice"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {editingId
                  ? "Changes apply only to the selected notice."
                  : "Each submission creates a separate notice and preserves existing notices."}
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={startNewNotice}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="notice-title"
                  className="mb-2 block text-sm font-semibold"
                >
                  Notice title *
                </label>
                <input
                  id="notice-title"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="e.g. School will remain closed"
                  maxLength={200}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                />
              </div>

              <div>
                <label
                  htmlFor="notice-date"
                  className="mb-2 block text-sm font-semibold"
                >
                  Notice date *
                </label>
                <input
                  id="notice-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => updateField("date", e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="notice-description"
                className="mb-2 block text-sm font-semibold"
              >
                Description *
              </label>
              <textarea
                id="notice-description"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Enter the full announcement..."
                rows={5}
                maxLength={5000}
                required
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
              />
            </div>

            <div>
              <label
                htmlFor="notice-pdf"
                className="mb-2 block text-sm font-semibold"
              >
                Document link (optional)
              </label>
              <input
                id="notice-pdf"
                type="url"
                value={form.pdfUrl}
                onChange={(e) => updateField("pdfUrl", e.target.value)}
                placeholder="https://drive.google.com/..."
                maxLength={2048}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Paste a shareable document URL and check that visitors have
                permission to open it.
              </p>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => {
                  const published = e.target.checked;
                  updateField("published", published);

                  if (!published) {
                    updateField("isLatest", false);
                  }
                }}
                className="mt-1 h-4 w-4 accent-amber-500"
              />
              <span>
                <span className="block text-sm font-semibold">
                  Publish notice
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  Published notices can appear on the public school website.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <input
                type="checkbox"
                checked={form.isLatest}
                disabled={!form.published}
                onChange={(e) =>
                  updateField("isLatest", e.target.checked)
                }
                className="mt-1 h-4 w-4 accent-amber-500 disabled:opacity-50"
              />
              <span>
                <span className="block text-sm font-semibold">
                  ★ Set as Latest Notice
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-600">
                  Select this published notice to appear first on the homepage
                  and in the announcement banner. Selecting a different notice
                  as Latest replaces the selection without deleting older
                  notices.
                </span>
              </span>
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#10284b] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#183963] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Create notice"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={startNewNotice}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Discard edit and create new
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">Saved notices</h2>
              <p className="mt-1 text-sm text-slate-500">
                {notices.length} total notice
                {notices.length === 1 ? "" : "s"}
              </p>
            </div>

            <input
              type="search"
              aria-label="Search notices"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notices..."
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500 sm:max-w-xs"
            />
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Loading notices...
            </p>
          ) : filteredNotices.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 px-5 py-12 text-center">
              <p className="font-semibold text-slate-700">No notices found</p>
              <p className="mt-2 text-sm text-slate-500">
                Create a notice using the form above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotices.map((notice) => (
                <article
                  key={notice._id}
                  className={`rounded-xl border p-4 transition sm:p-5 ${
                    notice.isLatest && notice.published
                      ? "border-amber-300 bg-amber-50/40"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            notice.published
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {notice.published ? "Published" : "Draft"}
                        </span>

                        {notice.isLatest && notice.published && (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                            ★ Latest
                          </span>
                        )}

                        <span className="text-xs text-slate-500">
                          {notice.date}
                        </span>
                      </div>

                      <h3 className="break-words text-lg font-bold">
                        {notice.title}
                      </h3>

                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                        {notice.description}
                      </p>

                      {notice.pdfUrl && (
                        <a
                          href={notice.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex text-sm font-semibold text-blue-700 underline underline-offset-4"
                        >
                          Open attached document
                        </a>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
                      {!notice.isLatest && notice.published && (
                        <button
                          type="button"
                          onClick={() => void setLatestNotice(notice)}
                          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
                        >
                          Set as Latest
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => startEditing(notice)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => void togglePublished(notice)}
                        className="rounded-lg border border-amber-200 px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50"
                      >
                        {notice.published ? "Unpublish" : "Publish"}
                      </button>

                      <button
                        type="button"
                        onClick={() => void deleteNotice(notice)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
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
