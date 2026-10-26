
"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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

const CATEGORIES: Category[] = [
  "PGT Teachers",
  "TGT Teachers",
  "PRT Teachers",
];

const easeOut = [0.22, 1, 0.36, 1] as const;

function normalizeCategory(value: Staff["category"]): Category | null {
  if (value === "PGT" || value === "PGT Teachers") return "PGT Teachers";
  if (value === "TGT" || value === "TGT Teachers") return "TGT Teachers";
  if (value === "PRT" || value === "PRT Teachers") return "PRT Teachers";
  return null;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function MeetOurTeachers() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [activeCategory, setActiveCategory] =
    useState<Category>("PGT Teachers");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduceMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadStaff() {
      try {
        const response = await fetch("/api/staff/public", {
          cache: "no-store",
        });

        const contentType = response.headers.get("content-type") ?? "";

        if (!contentType.includes("application/json")) {
          throw new Error("The staff endpoint did not return JSON.");
        }

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(
            payload.error ?? "Unable to load teachers.",
          );
        }

        // Support flat arrays and category-grouped responses.
        const records: Staff[] = Array.isArray(payload.staff)
          ? payload.staff
          : Array.isArray(payload.data)
            ? payload.data
            : payload.staff && typeof payload.staff === "object"
              ? CATEGORIES.flatMap((category) => {
                  const group =
                    payload.staff[category] ??
                    payload.staff[category.replace(" Teachers", "")];

                  if (!Array.isArray(group)) return [];

                  return group.map((person: Staff) => ({
                    ...person,
                    category: person.category ?? category,
                  }));
                })
              : [];

        if (active) {
          setStaff(
            records.flatMap((person) => {
              const category = person?.category
                ? normalizeCategory(person.category)
                : null;

              if (!category || person.published === false) {
                return [];
              }

              return [{ ...person, category }];
            }),
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load teachers.",
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

  const teachers = useMemo(
    () =>
      staff
        .filter(
          (person) =>
            normalizeCategory(person.category) === activeCategory,
        )
        .sort(
          (a, b) =>
            (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
            a.name.localeCompare(b.name),
        ),
    [staff, activeCategory],
  );

  const reveal = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.12 },
      };

  return (
    <section
      id="teachers"
      className="relative isolate overflow-hidden bg-[#f4f7fb] py-16 sm:py-20"
    >
      {/* Subtle animated background */}
      {!reduceMotion && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <motion.div
            animate={{ x: [0, 14, 0], y: [0, -10, 0] }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -right-16 top-8 h-48 w-48 rounded-full bg-amber-200/25 blur-3xl sm:h-64 sm:w-64"
          />

          <motion.div
            animate={{ x: [0, -10, 0], y: [0, 12, 0] }}
            transition={{
              duration: 17,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -left-16 bottom-8 h-48 w-48 rounded-full bg-slate-200/50 blur-3xl sm:h-64 sm:w-64"
          />
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <motion.div
          {...reveal}
          transition={{ duration: 0.65, ease: easeOut }}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="mb-4 inline-flex items-center gap-3">
            <span className="h-px w-7 bg-amber-500" />
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-amber-600">
              Our Faculty
            </p>
            <span className="h-px w-7 bg-amber-500" />
          </div>

          <h2 className="font-serif text-3xl font-extrabold tracking-tight text-[#10264b] sm:text-4xl lg:text-5xl">
            Meet Our Teachers
          </h2>

          <motion.div
            initial={reduceMotion ? false : { width: 20 }}
            whileInView={reduceMotion ? {} : { width: 58 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.65,
              delay: 0.15,
              ease: easeOut,
            }}
            className="mx-auto mt-4 h-1 rounded-full bg-amber-400"
          />

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Meet the dedicated educators who guide, inspire, and support
            our students every day.
          </p>
        </motion.div>

        {/* Category tabs */}
        <div
          role="tablist"
          aria-label="Teacher categories"
          className="mx-auto mt-9 grid max-w-xl grid-cols-3 gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm"
        >
          {CATEGORIES.map((category) => {
            const selected = activeCategory === category;
            const count = staff.filter(
              (person) =>
                normalizeCategory(person.category) === category,
            ).length;

            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="teacher-panel"
                onClick={() => setActiveCategory(category)}
                className={`relative min-w-0 rounded-xl px-2 py-3 text-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 sm:px-3 ${
                  selected
                    ? "text-white"
                    : "text-slate-600 hover:bg-slate-50 hover:text-[#10264b]"
                }`}
              >
                {selected && (
                  <motion.span
                    layoutId="meet-teachers-active-tab"
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 30,
                    }}
                    className="absolute inset-0 rounded-xl bg-[#10264b] shadow-md"
                  />
                )}

                <span className="relative z-10 block text-sm font-extrabold sm:text-base">
                  {category.replace(" Teachers", "")}
                </span>

                <span
                  className={`relative z-10 mt-1 block text-[9px] font-bold uppercase tracking-wider sm:text-[10px] ${
                    selected ? "text-white/75" : "text-slate-400"
                  }`}
                >
                  {String(count).padStart(2, "0")} Teachers
                </span>
              </button>
            );
          })}
        </div>

        {/* Teacher panel */}
        <div
          id="teacher-panel"
          role="tabpanel"
          aria-live="polite"
          aria-label={activeCategory}
          className="mt-8"
        >
          <motion.div
            key={`${activeCategory}-heading`}
            initial={reduceMotion ? false : { opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: easeOut }}
            className="mb-5 flex items-end justify-between gap-4"
          >
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-amber-600">
                Teaching Faculty
              </p>

              <h3 className="mt-1 text-xl font-extrabold text-[#10264b] sm:text-2xl">
                {activeCategory}
              </h3>
            </div>

            <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
              {loading ? "Loading…" : `${teachers.length} teachers`}
            </span>
          </motion.div>

          {loading ? (
            <div
              role="status"
              aria-label="Loading teachers"
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
              Teacher profiles could not be loaded. Check the{" "}
              <code>/api/staff/public</code> endpoint.
            </div>
          ) : teachers.length === 0 ? (
            <motion.div
              {...reveal}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500"
            >
              No published {activeCategory.toLowerCase()} are available yet.
            </motion.div>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeCategory}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -5 }}
                transition={{ duration: 0.25, ease: easeOut }}
                className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5"
              >
                {teachers.map((person, index) => {
                  const photo =
                    person.photoUrl ||
                    (person.photoId
                      ? `/api/staff/photo/${person.photoId}`
                      : "");

                  return (
                    <motion.article
                      key={person._id}
                      initial={
                        reduceMotion
                          ? false
                          : { opacity: 0, y: 22, scale: 0.97 }
                      }
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        duration: 0.45,
                        delay: reduceMotion
                          ? 0
                          : Math.min(index * 0.07, 0.28),
                        ease: easeOut,
                      }}
                      whileHover={
                        reduceMotion
                          ? undefined
                          : { y: -5, scale: 1.01 }
                      }
                      className="group relative mx-auto flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white text-center shadow-[0_4px_20px_rgba(16,38,75,0.05)] transition-[border-color,box-shadow] duration-300 hover:border-amber-200 hover:shadow-[0_16px_36px_rgba(16,38,75,0.12)]"
                    >
                      {/* Top accent */}
                      <div className="h-1.5 shrink-0 overflow-hidden bg-slate-100">
                        <motion.div
                          initial={reduceMotion ? false : { x: "-100%" }}
                          animate={{ x: "0%" }}
                          transition={{
                            duration: 0.6,
                            delay: reduceMotion
                              ? 0
                              : Math.min(index * 0.05, 0.25),
                            ease: easeOut,
                          }}
                          className="h-full w-full bg-gradient-to-r from-amber-500 to-orange-400"
                        />
                      </div>

                      {/* Portrait and rotating CSS ring */}
                      <div className="flex justify-center px-2 pt-6 sm:pt-7">
                        <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28">
                          <div
                            aria-hidden="true"
                            className="teacher-rotating-ring pointer-events-none absolute -inset-2 z-0 rounded-full border-[3px] border-dashed border-amber-500"
                          />

                          <div className="absolute inset-0 z-10 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md ring-1 ring-slate-200">
                            {photo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <motion.img
                                src={photo}
                                alt={person.name}
                                loading="lazy"
                                decoding="async"
                                whileHover={
                                  reduceMotion
                                    ? undefined
                                    : { scale: 1.08 }
                                }
                                transition={{
                                  duration: 0.35,
                                  ease: easeOut,
                                }}
                                className="block h-full w-full rounded-full object-cover object-top"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#10264b] text-2xl font-extrabold text-white">
                                {getInitials(person.name)}
                              </div>
                            )}
                          </div>

                          <span className="absolute bottom-1 right-0 z-20 h-4 w-4 rounded-full border-[3px] border-white bg-amber-500" />
                        </div>
                      </div>

                      {/* Teacher details */}
                      <div className="flex flex-1 flex-col px-3 pb-5 pt-4 sm:px-4">
                        <h4 className="min-h-10 break-words text-xs font-extrabold leading-5 text-slate-900 sm:text-sm">
                          {person.name}
                        </h4>

                        <p className="mt-1 break-words text-[10px] font-semibold leading-4 text-amber-700 sm:text-xs sm:leading-5">
                          {person.designation}
                        </p>

                        {person.subject?.trim() && (
                          <p className="mt-2 break-words text-[10px] text-slate-600 sm:text-xs">
                            {person.subject}
                          </p>
                        )}

                        <div className="mt-auto pt-4">
                          <span className="inline-flex max-w-full rounded-full bg-amber-50 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-inset ring-amber-100 sm:text-[10px]">
                            {activeCategory.replace(" Teachers", "")}
                          </span>
                        </div>
                      </div>

                      {/* Bottom hover accent */}
                      <motion.div
                        initial={false}
                        animate={{ scaleX: 0 }}
                        whileHover={
                          reduceMotion ? undefined : { scaleX: 1 }
                        }
                        transition={{ duration: 0.25 }}
                        className="absolute bottom-0 left-0 h-1 w-full origin-left bg-amber-500"
                      />
                    </motion.article>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </section>
  );
}
