
"use client";

import { useEffect, useState } from "react";

const CATEGORIES = [
  "PGT Teachers",
  "TGT Teachers",
  "PRT Teachers",
] as const;

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

        if (!response.ok) {
          throw new Error(data.error || "Could not load staff.");
        }

        if (active) {
          setStaff(data.staff);
        }
      })
      .catch((error) => {
        console.error("Public staff load failed:", error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Section heading */}
      <div className="mb-10 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-700">
          04 — Human Resources
        </p>

        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Staff Information
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Meet the teaching staff of De-Paul Senior Secondary School, Aska.
        </p>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-slate-500">
          Loading staff information…
        </p>
      ) : (
        <div className="space-y-12">
          {CATEGORIES.map((category) => {
            const people = staff[category] ?? [];

            if (people.length === 0) return null;

            return (
              <section key={category}>
                <div className="mb-5 text-center">
                  <h3 className="text-xl font-semibold text-slate-800">
                    {category}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {category === "PGT Teachers"
                      ? "Post Graduate Teachers"
                      : category === "TGT Teachers"
                        ? "Trained Graduate Teachers"
                        : "Primary Teachers"}
                  </p>
                </div>

                {/* Responsive staff grid */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {people.map((person) => (
                    <article
                      key={person._id}
                      className="group min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg"
                    >
                      {/* Card accent */}
                      <div className="h-10 bg-gradient-to-r from-teal-100 via-emerald-50 to-slate-50" />

                      {/* Fixed-size photo */}
                      <div className="-mt-8 flex justify-center">
                        {person.photoUrl ? (
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md">
                            <img
                              src={person.photoUrl}
                              alt={person.name}
                              loading="lazy"
                              className="absolute inset-0 block h-full w-full object-cover object-center"
                            />
                          </div>
                        ) : (
                          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-4 border-white bg-slate-100 text-2xl font-bold text-slate-500 shadow-md">
                            {person.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Staff details */}
                      <div className="px-3 pb-5 pt-3">
                        <h4 className="min-h-10 break-words text-sm font-bold leading-5 text-slate-900">
                          {person.name}
                        </h4>

                        {person.designation && (
                          <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                            {person.designation}
                          </p>
                        )}

                        {person.subject && (
                          <p className="mt-1 break-words text-xs font-medium text-slate-600">
                            {person.subject}
                          </p>
                        )}

                        <span className="mt-3 inline-flex rounded-full bg-teal-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-800 ring-1 ring-inset ring-teal-100">
                          {category.replace(" Teachers", "")}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}

          {!CATEGORIES.some((category) => staff[category]?.length) && (
            <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              Staff profiles will appear here once published by the school
              administrator.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
