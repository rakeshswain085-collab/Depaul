"use client";

import { useEffect, useState } from "react";

const CATEGORIES = ["PGT Teachers", "TGT Teachers", "PRT Teachers"] as const;
type Category = (typeof CATEGORIES)[number];
type Person = {
  _id: string;
  name: string;
  designation: string;
  subject: string;
  category: Category;
  photoUrl: string;
};
type GroupedStaff = Record<Category, Person[]>;

export function StaffInformation() {
  const [staff, setStaff] = useState<GroupedStaff>({
    "PGT Teachers": [],
    "TGT Teachers": [],
    "PRT Teachers": [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/staff/public")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load staff.");
        if (active) setStaff(data.staff);
      })
      .catch((error) => console.error("Public staff load failed:", error))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-700">04 — Human Resources</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Staff Information</h2>
        <p className="mt-2 text-sm text-slate-500">Meet the teaching staff of De-Paul Senior Secondary School, Aska.</p>
      </div>

      {loading ? <p className="py-8 text-center text-sm text-slate-500">Loading staff information…</p> : (
        <div className="space-y-12">
          {CATEGORIES.map((category) => {
            const people = staff[category] ?? [];
            if (people.length === 0) return null;
            return (
              <section key={category}>
                <div className="mb-5 text-center">
                  <h3 className="text-xl font-semibold text-slate-800">{category}</h3>
                  <p className="mt-1 text-sm text-slate-500">{category === "PGT Teachers" ? "Post Graduate Teachers" : category === "TGT Teachers" ? "Trained Graduate Teachers" : "Primary Teachers"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {people.map((person) => (
                    <article key={person._id} className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-center shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">
                      <div className="h-10 bg-gradient-to-r from-teal-100 to-emerald-50" />
                      <div className="-mt-8 flex justify-center">
                        {person.photoUrl ? (
                          <img src={person.photoUrl} alt={person.name} loading="lazy" className="h-20 w-20 rounded-full border-4 border-white bg-white object-cover shadow-sm" />
                        ) : (
                          <div className="grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-slate-100 text-2xl font-bold text-slate-400 shadow-sm">{person.name.slice(0, 1).toUpperCase()}</div>
                        )}
                      </div>
                      <div className="px-3 pb-5 pt-3">
                        <h4 className="text-sm font-semibold text-slate-800">{person.name}</h4>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{person.designation}</p>
                        {person.subject && <p className="mt-1 text-xs text-slate-500">{person.subject}</p>}
                        <span className="mt-3 inline-flex rounded-full bg-teal-700 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-white">{category.replace(" Teachers", "")}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
          {!CATEGORIES.some((category) => staff[category]?.length) && (
            <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Staff profiles will appear here once published by the school administrator.</p>
          )}
        </div>
      )}
    </section>
  );
}
