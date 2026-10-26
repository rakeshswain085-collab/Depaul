"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const STATUSES = [
  "new",
  "in_progress",
  "awaiting_response",
  "replied",
  "follow_up",
  "admitted",
  "not_admitted",
  "closed",
] as const;

type EnquiryStatus = (typeof STATUSES)[number];

type Enquiry = {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  status: EnquiryStatus;
  createdAt: string;
  updatedAt: string;
};

const STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: "New",
  in_progress: "In Progress",
  awaiting_response: "Awaiting Parent Response",
  replied: "Replied",
  follow_up: "Follow-up Required",
  admitted: "Admitted",
  not_admitted: "Not Admitted",
  closed: "Closed",
};

const fieldClass =
  "h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100";

async function requestEnquiries(signal?: AbortSignal): Promise<Enquiry[]> {
  const response = await fetch("/api/admin/enquiries", {
    cache: "no-store",
    signal,
  });
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Unable to load admission enquiries.");
  }

  return Array.isArray(result.enquiries) ? result.enquiries : [];
}

export default function AdmissionEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    void requestEnquiries(controller.signal)
      .then((items) => {
        setEnquiries(items);
        setError("");
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load admission enquiries.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  async function refreshEnquiries() {
    setLoading(true);
    setError("");

    try {
      setEnquiries(await requestEnquiries());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load admission enquiries.",
      );
    } finally {
      setLoading(false);
    }
  }

  const subjects = useMemo(
    () => [...new Set(enquiries.map((enquiry) => enquiry.subject))].sort(),
    [enquiries],
  );

  const filteredEnquiries = useMemo(() => {
    const term = search.trim().toLowerCase();

    return enquiries.filter((enquiry) => {
      const matchesSearch =
        !term ||
        [
          enquiry.name,
          enquiry.phone,
          enquiry.email,
          enquiry.subject,
          enquiry.message,
        ].some((value) => value.toLowerCase().includes(term));

      return (
        matchesSearch &&
        (statusFilter === "all" || enquiry.status === statusFilter) &&
        (subjectFilter === "all" || enquiry.subject === subjectFilter)
      );
    });
  }, [enquiries, search, statusFilter, subjectFilter]);

  async function updateStatus(enquiry: Enquiry, status: EnquiryStatus) {
    if (status === enquiry.status) return;

    setUpdatingIds((ids) => [...ids, enquiry.id]);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/enquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: enquiry.id, status }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to update enquiry status.");
      }

      setEnquiries((items) =>
        items.map((item) => (item.id === enquiry.id ? result.enquiry : item)),
      );
      setMessage(`Status updated for ${enquiry.name}.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update enquiry status.",
      );
    } finally {
      setUpdatingIds((ids) => ids.filter((id) => id !== enquiry.id));
    }
  }

  function toggleSelected(id: string) {
    setSelectedIds((ids) =>
      ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id],
    );
  }

  const allVisibleSelected =
    filteredEnquiries.length > 0 &&
    filteredEnquiries.every((enquiry) => selectedIds.includes(enquiry.id));

  function toggleSelectVisible() {
    const visibleIds = filteredEnquiries.map((enquiry) => enquiry.id);
    setSelectedIds((ids) =>
      allVisibleSelected
        ? ids.filter((id) => !visibleIds.includes(id))
        : [...new Set([...ids, ...visibleIds])],
    );
  }

  async function deleteEnquiries(ids: string[]) {
    if (ids.length === 0 || deleting) return;

    const prompt =
      ids.length === 1
        ? `Permanently delete the enquiry from ${enquiries.find((item) => item.id === ids[0])?.name ?? "this parent"}? This cannot be undone.`
        : `Permanently delete ${ids.length} selected enquiries? This cannot be undone.`;
    if (!window.confirm(prompt)) return;

    setDeleting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/enquiries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids.length === 1 ? { id: ids[0] } : { ids }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to delete enquiries.");
      }

      const deletedIds = new Set(ids);
      setEnquiries((items) => items.filter((item) => !deletedIds.has(item.id)));
      setSelectedIds((items) => items.filter((id) => !deletedIds.has(id)));
      setMessage(
        `${result.deletedCount} ${result.deletedCount === 1 ? "enquiry" : "enquiries"} deleted.`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete enquiries.",
      );
    } finally {
      setDeleting(false);
    }
  }

  function replyLink(enquiry: Enquiry) {
    const subject = `Re: ${enquiry.subject} - De-Paul School`;
    const body = [
      `Dear ${enquiry.name},`,
      "",
      "Thank you for contacting De-Paul Senior Secondary School.",
      "",
      "Regarding your enquiry:",
      enquiry.message,
      "",
      "Regards,",
      "De-Paul School Office",
    ].join("\n");

    return `mailto:${enquiry.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  const stats = [
    { label: "Total Enquiries", value: enquiries.length, icon: "✉️" },
    {
      label: "New Enquiries",
      value: enquiries.filter((enquiry) => enquiry.status === "new").length,
      icon: "🆕",
    },
    {
      label: "Replied",
      value: enquiries.filter((enquiry) => enquiry.status === "replied").length,
      icon: "✓",
    },
    {
      label: "Follow-ups",
      value: enquiries.filter((enquiry) => enquiry.status === "follow_up").length,
      icon: "📅",
    },
  ];

  return (
    <main className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
            Administration
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Admission Enquiries
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Review parent enquiries and manage communication with families.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={refreshEnquiries}
            disabled={loading}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <Link
            href="/admission"
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            View Admission Page
          </Link>
        </div>
      </div>

      {(error || message) && (
        <div
          role={error ? "alert" : "status"}
          className={`mt-5 rounded-lg border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {error || message}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-500 sm:text-sm">
                {stat.label}
              </p>
              <span aria-hidden="true">{stat.icon}</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900">
              {stat.value}
            </p>
          </article>
        ))}
      </div>

      <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <h2 className="text-base font-bold text-slate-900">All Enquiries</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
            Search submissions, update their status, and contact parents.
          </p>
        </div>

        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, phone, email or message..."
            aria-label="Search enquiries"
            className={fieldClass}
          />
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={fieldClass}
          >
            <option value="all">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by subject"
            value={subjectFilter}
            onChange={(event) => setSubjectFilter(event.target.value)}
            className={fieldClass}
          >
            <option value="all">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

        {!loading && filteredEnquiries.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
            <label className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleSelectVisible}
                aria-label="Select all visible enquiries"
                className="h-4 w-4 rounded border-slate-300 accent-amber-600"
              />
              Select visible ({filteredEnquiries.length})
            </label>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => void deleteEnquiries(selectedIds)}
                disabled={deleting}
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting
                  ? "Deleting..."
                  : `Delete selected (${selectedIds.length})`}
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">
            Loading enquiries...
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="px-5 py-12 text-center sm:py-16">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-2xl"
              aria-hidden="true"
            >
              ✉️
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">
              {enquiries.length === 0
                ? "No enquiries yet"
                : "No matching enquiries"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {enquiries.length === 0
                ? "Enquiries submitted through the school website will appear here."
                : "Try changing your search or filters."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredEnquiries.map((enquiry) => (
              <article key={enquiry.id} className="p-4 sm:p-5">
                <div className="flex flex-col justify-between gap-4 lg:flex-row">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(enquiry.id)}
                        onChange={() => toggleSelected(enquiry.id)}
                        aria-label={`Select enquiry from ${enquiry.name}`}
                        className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-amber-600"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words text-base font-bold text-slate-900">
                            {enquiry.name}
                          </h3>
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                            {enquiry.subject}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Received{" "}
                          {new Date(enquiry.createdAt).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                          {enquiry.message}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full shrink-0 flex-col gap-3 lg:w-64">
                    <label className="text-xs font-semibold text-slate-600">
                      Enquiry status
                      <select
                        aria-label={`Status for ${enquiry.name}`}
                        value={enquiry.status}
                        disabled={updatingIds.includes(enquiry.id)}
                        onChange={(event) =>
                          void updateStatus(
                            enquiry,
                            event.target.value as EnquiryStatus,
                          )
                        }
                        className={`${fieldClass} mt-1`}
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`tel:${enquiry.phone.replace(/[^\d+]/g, "")}`}
                        className="inline-flex min-h-10 items-center justify-center rounded-lg bg-navy-800 px-3 py-2 text-sm font-semibold text-white transition hover:bg-navy-700"
                      >
                        Call Parent
                      </a>
                      {enquiry.email ? (
                        <a
                          href={replyLink(enquiry)}
                          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Email Reply
                        </a>
                      ) : (
                        <span className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-100 px-3 py-2 text-center text-xs text-slate-400">
                          No email provided
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteEnquiries([enquiry.id])}
                      disabled={deleting || updatingIds.includes(enquiry.id)}
                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Delete enquiry
                    </button>
                    <p className="break-all text-xs text-slate-500">
                      {enquiry.email || "Email not provided"}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="mt-4 text-xs leading-5 text-slate-400">
        Showing {filteredEnquiries.length} of {enquiries.length} enquiries ·
        Admission Enquiry Management
      </p>
    </main>
  );
}
