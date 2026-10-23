"use client";

import { useEffect, useState } from "react";

type StaffCategory = "PGT Teachers" | "TGT Teachers" | "PRT Teachers";

type StaffMember = {
  _id: string;
  name: string;
  designation: string;
  subject?: string;
  category: StaffCategory;
  photoId?: string;
  photoUrl?: string;
  published: boolean;
  sortOrder?: number;
};

const CATEGORIES: StaffCategory[] = [
  "PGT Teachers",
  "TGT Teachers",
  "PRT Teachers",
];

export function HomeStaffSection() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadStaff() {
      try {
        const response = await fetch("/api/staff/public", {
          cache: "no-store",
        });

        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) {
          throw new Error("The staff API did not return JSON.");
        }

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load staff.");
        }

        // Support either { staff: [...] } or { success: true, data: [...] }.
        const records: StaffMember[] = Array.isArray(payload.staff)
          ? payload.staff
          : Array.isArray(payload.data)
            ? payload.data
            : [];

        if (active) {
          setStaff(records.filter((person) => person.published !== false));
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load staff information."
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

  return (
    <section id="our-teachers" className="bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
            The people who inspire
          </p>
          <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-[#10264b] sm:text-4xl">
            Meet Our Teachers
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
            Dedicated educators helping students learn, grow, and achieve their
            best every day.
          </p>
          <div className="mx-auto mt-5 h-1 w-14 rounded-full bg-amber-400" />
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="h-56 bg-slate-200" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-2/3 rounded bg-slate-200" />
                  <div className="h-3 w-1/2 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-900">
            Teacher information is temporarily unavailable.
          </p>
        ) : staff.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
            Teacher profiles will be published here soon.
          </p>
        ) : (
          <div className="space-y-12">
            {CATEGORIES.map((category) => {
              const people = staff
                .filter((person) => person.category === category)
                .sort(
                  (a, b) =>
                    (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
                    a.name.localeCompare(b.name)
                );

              if (!people.length) return null;

              return (
                <div key={category}>
                  <div className="mb-5 flex items-center gap-3">
                    <span className="h-7 w-1 rounded-full bg-amber-400" />
                    <h3 className="text-xl font-bold text-[#10264b] sm:text-2xl">
                      {category}
                    </h3>
                    <span className="rounded-full bg-[#10264b]/[0.06] px-3 py-1 text-xs font-semibold text-[#10264b]">
                      {people.length}
                    </span>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {people.map((person) => {
                      const photo =
                        person.photoUrl ||
                        (person.photoId
                          ? `/api/staff/photo/${person.photoId}`
                          : "");

                      return (
                        <article
                          key={person._id}
                          className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                        >
                          <div className="relative flex h-60 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                            {photo ? (
                              // Use a normal img for the dynamic GridFS API URL.
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={photo}
                                alt={person.name}
                                loading="lazy"
                                className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]"
                              />
                            ) : (
                              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#10264b] text-3xl font-bold text-white">
                                {person.name
                                  .split(/\s+/)
                                  .filter(Boolean)
                                  .slice(0, 2)
                                  .map((part) => part[0]?.toUpperCase())
                                  .join("")}
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/45 to-transparent" />
                          </div>

                          <div className="p-5">
                            <h4 className="text-lg font-bold text-slate-900">
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
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10 text-center">
          <a
            href="/mandatory-disclosure"
            className="inline-flex items-center gap-2 rounded-lg bg-[#10264b] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#193967]"
          >
            View Mandatory Disclosure
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
