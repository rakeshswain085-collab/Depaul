"use client";

import { useEffect, useMemo, useState } from "react";

type Category = "PGT Teachers" | "TGT Teachers" | "PRT Teachers";
type Staff = {
  _id: string;
  name: string;
  designation: string;
  subject?: string;
  category: Category | "PGT" | "TGT" | "PRT";
  photoId?: string;
  photoUrl?: string;
  published?: boolean;
  sortOrder?: number;
};

const CATEGORIES: Category[] = ["PGT Teachers", "TGT Teachers", "PRT Teachers"];

function normalizeCategory(value: Staff["category"]): Category | null {
  if (value === "PGT" || value === "PGT Teachers") return "PGT Teachers";
  if (value === "TGT" || value === "TGT Teachers") return "TGT Teachers";
  if (value === "PRT" || value === "PRT Teachers") return "PRT Teachers";
  return null;
}

export default function MeetOurTeachers() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>("PGT Teachers");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/staff/public", { cache: "no-store" });
        const type = response.headers.get("content-type") ?? "";
        if (!type.includes("application/json")) {
          throw new Error("The staff endpoint did not return JSON.");
        }
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Unable to load teachers.");
        const records = Array.isArray(payload.staff)
          ? payload.staff
          : Array.isArray(payload.data)
            ? payload.data
            : [];
        if (active) {
          setStaff(records.flatMap((person: Staff) => {
            const category = normalizeCategory(person.category);
            if (!category || person.published === false) return [];
            return [{ ...person, category }];
          }));
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load teachers.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const teachers = useMemo(() => staff
    .filter((person) => normalizeCategory(person.category) === activeCategory)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)),
    [staff, activeCategory]);

  return (
    <section id="teachers" className="relative overflow-hidden bg-[#f4f7fb] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-amber-600">Our Faculty</p>
          <h2 className="mt-3 font-serif text-3xl font-extrabold tracking-tight text-[#10264b] sm:text-4xl">
            Meet Our Teachers
          </h2>
          <div className="mx-auto mt-4 h-1 w-14 rounded-full bg-amber-400" />
          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
            Meet the dedicated educators who guide, inspire, and support our students every day.
          </p>
        </div>

        <div role="tablist" aria-label="Teacher categories" className="mx-auto mt-9 grid max-w-xl grid-cols-3 gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          {CATEGORIES.map((category) => {
            const selected = activeCategory === category;
            const count = staff.filter((person) => normalizeCategory(person.category) === category).length;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveCategory(category)}
                className={`rounded-xl px-3 py-3 transition duration-200 ${selected ? "bg-[#10264b] text-white shadow-md" : "text-slate-600 hover:bg-slate-50 hover:text-[#10264b]"}`}
              >
                <span className="block text-sm font-extrabold sm:text-base">{category.replace(" Teachers", "")}</span>
                <span className={`mt-1 block text-[10px] font-bold uppercase tracking-wider ${selected ? "text-white/75" : "text-slate-400"}`}>
                  Teachers · {String(count).padStart(2, "0")}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-8" aria-live="polite">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-amber-600">Teaching Faculty</p>
              <h3 className="mt-1 text-xl font-extrabold text-[#10264b] sm:text-2xl">{activeCategory}</h3>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
              {loading ? "Loading…" : `${teachers.length} teachers`}
            </span>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
              Teacher profiles could not be loaded. Check the /api/staff/public endpoint.
            </div>
          ) : teachers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
              No published {activeCategory.toLowerCase()} are available yet.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {teachers.map((person) => {
                const photo = person.photoUrl || (person.photoId ? `/api/staff/photo/${person.photoId}` : "");
                const initials = person.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
                return (
                  <article key={person._id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <div className="flex h-52 items-center justify-center overflow-hidden bg-slate-100 sm:h-56">
                      {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photo} alt={person.name} loading="lazy" className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]" />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#10264b] text-xl font-extrabold text-white">{initials}</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="font-extrabold text-slate-900">{person.name}</h4>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-amber-700">{person.subject?.trim() || person.designation}</p>
                      {person.subject?.trim() && <p className="mt-1 text-xs text-slate-500">{person.designation}</p>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
