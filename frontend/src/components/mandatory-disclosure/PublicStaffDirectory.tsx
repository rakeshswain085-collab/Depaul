"use client";

import { useEffect, useMemo, useState } from "react";

type Category = "PGT Teachers" | "TGT Teachers" | "PRT Teachers";

type Staff = {
  _id: string;
  name: string;
  designation: string;
  subject?: string;
  category: Category;
  photoId?: string;
  photoUrl?: string;
  published?: boolean;
  sortOrder?: number;
};

const CATEGORIES: Category[] = [
  "PGT Teachers",
  "TGT Teachers",
  "PRT Teachers",
];

const PRINCIPAL_NAME = "Ms. Rajani Panda";
const PRINCIPAL_DESIGNATION = "Principal";
// Add the principal's photo at public/images/principal.jpg.
// If the file is missing, initials will be shown instead.

export default function PublicStaffDirectory() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<Category>("PGT Teachers");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [principalPhotoFailed, setPrincipalPhotoFailed] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadStaff() {
      try {
        const response = await fetch("/api/staff/public", {
          cache: "no-store",
        });
        const contentType = response.headers.get("content-type") ?? "";

        if (!contentType.includes("application/json")) {
          throw new Error("Staff API did not return JSON.");
        }

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load staff.");
        }

        const records = Array.isArray(payload.staff)
          ? payload.staff
          : Array.isArray(payload.data)
            ? payload.data
            : [];

        if (active) {
          setStaff(
            records.filter(
              (person: Staff) =>
                person &&
                person.published !== false &&
                CATEGORIES.includes(person.category)
            )
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load teacher profiles."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadStaff();
    return () => {
      active = false;
    };
  }, []);

  const selectedTeachers = useMemo(
    () =>
      staff
        .filter((person) => person.category === selectedCategory)
        .sort(
          (a, b) =>
            (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
            a.name.localeCompare(b.name)
        ),
    [staff, selectedCategory]
  );

  return (
    <div className="space-y-8">
      {/* Principal centered above the category tabs */}
      <section className="flex flex-col items-center text-center">
        <div className="relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-lg ring-1 ring-slate-200 sm:h-40 sm:w-40">
          {!principalPhotoFailed ? (
            // Put the principal's image at public/images/principal.jpg.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/images/principal.jpg"
              alt={PRINCIPAL_NAME}
              onError={() => setPrincipalPhotoFailed(true)}
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <span className="text-4xl font-extrabold text-navy-800">
              RP
            </span>
          )}
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
          School Leadership
        </p>
        <h3 className="mt-1 text-xl font-extrabold text-navy-900 sm:text-2xl">
          {PRINCIPAL_NAME}
        </h3>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          {PRINCIPAL_DESIGNATION}
        </p>
      </section>

      {/* Category selector */}
      <section>
        <div
          role="tablist"
          aria-label="Teacher categories"
          className="mx-auto grid max-w-2xl grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2"
        >
          {CATEGORIES.map((category) => {
            const active = selectedCategory === category;
            const count = staff.filter(
              (person) => person.category === category
            ).length;

            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-xl px-3 py-3 text-center transition duration-200 sm:px-5 ${
                  active
                    ? "bg-navy-800 text-white shadow-md"
                    : "bg-transparent text-slate-600 hover:bg-white hover:text-navy-800"
                }`}
              >
                <span className="block text-sm font-extrabold sm:text-base">
                  {category.replace(" Teachers", "")}
                </span>
                <span
                  className={`mt-1 block text-[10px] font-semibold uppercase tracking-wider sm:text-xs ${
                    active ? "text-white/75" : "text-slate-400"
                  }`}
                >
                  Teachers · {String(count).padStart(2, "0")}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Only the selected category is displayed */}
      <section aria-live="polite" className="min-h-40">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
              Teaching Faculty
            </p>
            <h3 className="mt-1 text-xl font-extrabold text-navy-900 sm:text-2xl">
              {selectedCategory}
            </h3>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
            {loading ? "Loading…" : `${selectedTeachers.length} teachers`}
          </span>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            Teacher profiles could not be loaded. Check the{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5">
              /api/staff/public
            </code>{" "}
            endpoint.
          </div>
        ) : selectedTeachers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <p className="font-semibold text-slate-700">
              No published {selectedCategory.toLowerCase()} yet.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Add teachers in the admin dashboard and mark them as published.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {selectedTeachers.map((person) => {
              const photo =
                person.photoUrl ||
                (person.photoId
                  ? `/api/staff/photo/${person.photoId}`
                  : "");

              return (
                <article
                  key={person._id}
                  className="group mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative flex h-60 items-center justify-center overflow-hidden bg-slate-100">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo}
                        alt={person.name}
                        loading="lazy"
                        className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-navy-800 text-2xl font-extrabold text-white">
                        {person.name
                          .split(/\s+/)
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0]?.toUpperCase())
                          .join("")}
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h4 className="font-bold text-slate-900">
                      {person.name}
                    </h4>
                    <p className="mt-1 text-sm font-semibold text-amber-700">
                      {person.designation}
                    </p>
                    {person.subject?.trim() ? (
                      <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">
                        <span className="font-semibold text-slate-700">
                          Subject:{" "}
                        </span>
                        {person.subject}
                      </p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
