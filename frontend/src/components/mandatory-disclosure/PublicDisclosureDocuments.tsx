"use client";

import { useEffect, useState } from "react";

type DisclosureDocument = {
  title?: string;
  description?: string;
  fileId?: string;
  fileName?: string;
  published?: boolean;
  academicYear?: string;
};

type DisclosureGroup = {
  title?: string;
  documents?: DisclosureDocument[];
};

type DisclosureContentResponse = {
  success?: boolean;
  data?: {
    documentsAndCertifications?: {
      title?: string;
      description?: string;
      groups?: DisclosureGroup[];
    };
  } | null;
  message?: string;
};

function DocumentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h8" />
    </svg>
  );
}

export default function PublicDisclosureDocuments() {
  const [groups, setGroups] = useState<DisclosureGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadDocuments() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/mandatory-disclosure/content", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load school documents.");
        }

        const result =
          (await response.json()) as DisclosureContentResponse;

        const savedGroups =
          result.data?.documentsAndCertifications?.groups ?? [];

        setGroups(
          savedGroups
            .map((group) => ({
              ...group,
              documents: (group.documents ?? []).filter(
                (document) =>
                  document.published === true &&
                  typeof document.fileId === "string" &&
                  document.fileId.length > 0,
              ),
            }))
            .filter((group) => (group.documents ?? []).length > 0),
        );
      } catch (cause) {
        if (cause instanceof Error && cause.name === "AbortError") return;
        setError(
          cause instanceof Error
            ? cause.message
            : "Something went wrong while loading documents.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadDocuments();
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div
        className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-sm text-slate-500"
        role="status"
      >
        Loading school documents…
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-sm text-red-700"
        role="alert"
      >
        {error}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
        <p className="text-sm font-semibold text-slate-700">
          No published documents are available yet.
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Published documents will appear here when they are added through the
          school administration panel.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group, groupIndex) => (
        <div
          key={`${group.title ?? "document-group"}-${groupIndex}`}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-navy-800">
              {group.title || "School Documents"}
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {(group.documents ?? []).map((document, index) => (
              <div
                key={`${document.fileId}-${document.title ?? index}`}
                className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-amber-50/50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <DocumentIcon />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-6 text-navy-800">
                      {document.title || document.fileName || "School document"}
                    </p>
                    {document.description && (
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {document.description}
                      </p>
                    )}
                    {document.academicYear && (
                      <p className="mt-1 text-xs text-slate-400">
                        Academic year: {document.academicYear}
                      </p>
                    )}
                    {document.fileName && (
                      <p className="mt-1 truncate text-xs text-slate-400">
                        {document.fileName}
                      </p>
                    )}
                  </div>
                </div>

                <a
                  href={`/api/mandatory-disclosure/file/${encodeURIComponent(
                    document.fileId!,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View ${document.title || document.fileName || "school document"}`}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-amber-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-amber-700 transition-all hover:border-amber-600 hover:bg-amber-600 hover:text-white"
                >
                  View Document
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M7 17 17 7M7 7h10v10" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
