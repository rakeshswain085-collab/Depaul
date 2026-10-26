
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SiteImage } from "@/components/site-image-provider";

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

export default function PublicStaffDirectory() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<Category>("PGT Teachers");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [principalPhotoFailed, setPrincipalPhotoFailed] = useState(false);

  const reduceMotion = useReducedMotion();

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

  const reveal = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 22 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.12 },
      };

  return (
    <div className="relative isolate space-y-10 overflow-hidden py-2 sm:space-y-14">
      {/* Animated background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <motion.div
          animate={
            reduceMotion ? {} : { x: [0, 16, 0], y: [0, -12, 0] }
          }
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-amber-200/20 blur-3xl sm:h-64 sm:w-64"
        />

        <motion.div
          animate={
            reduceMotion ? {} : { x: [0, -12, 0], y: [0, 16, 0] }
          }
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -left-16 top-1/3 h-48 w-48 rounded-full bg-slate-200/50 blur-3xl sm:h-64 sm:w-64"
        />
      </div>

      {/* Principal profile */}
      <motion.section
        {...reveal}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="flex flex-col items-center px-3 text-center"
      >
        <div className="relative mb-5 h-36 w-36 sm:h-40 sm:w-40">
          <motion.div
            aria-hidden="true"
            animate={reduceMotion ? {} : { rotate: 360 }}
            transition={{
              duration: 24,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -inset-2 rounded-full border-2 border-dashed border-amber-400"
          />

          <div className="absolute inset-0 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-xl ring-1 ring-slate-200">
            {!principalPhotoFailed ? (
              <motion.div
                initial={reduceMotion ? false : { scale: 1.08, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="h-full w-full"
              >
                <SiteImage
                  slot="principal"
                  alt={PRINCIPAL_NAME}
                  onError={() => setPrincipalPhotoFailed(true)}
                  className="h-full w-full rounded-full object-cover object-top"
                />
              </motion.div>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-navy-800 text-4xl font-extrabold text-white">
                RP
              </div>
            )}
          </div>

          <span className="absolute bottom-2 right-1 h-5 w-5 rounded-full border-4 border-white bg-amber-500 shadow-sm" />
        </div>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600"
        >
          School Leadership
        </motion.p>

        <h3 className="mt-2 text-xl font-extrabold text-navy-900 sm:text-2xl">
          {PRINCIPAL_NAME}
        </h3>

        <p className="mt-1 text-sm font-semibold text-slate-500">
          {PRINCIPAL_DESIGNATION}
        </p>

        <motion.div
          initial={reduceMotion ? false : { width: 20 }}
          animate={{ width: 54 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-4 h-1 rounded-full bg-amber-500"
        />
      </motion.section>

      {/* Category tabs */}
      <section>
        <div
          role="tablist"
          aria-label="Teacher categories"
          className="mx-auto grid max-w-2xl grid-cols-3 gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 sm:gap-2 sm:p-2"
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
                className={`relative min-w-0 rounded-xl px-1.5 py-3 text-center transition-colors duration-300 sm:px-4 ${
                  active
                    ? "text-white"
                    : "text-slate-600 hover:text-navy-800"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="staff-active-tab"
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 30,
                    }}
                    className="absolute inset-0 rounded-xl bg-navy-800 shadow-md"
                  />
                )}

                <span className="relative z-10 block text-xs font-extrabold sm:text-base">
                  {category.replace(" Teachers", "")}
                </span>

                <span
                  className={`relative z-10 mt-1 block text-[9px] font-semibold uppercase tracking-wide sm:text-xs ${
                    active ? "text-white/75" : "text-slate-400"
                  }`}
                >
                  {String(count).padStart(2, "0")} Teachers
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Selected teacher category */}
      <section aria-live="polite" className="min-h-40 px-1">
        <motion.div
          key={selectedCategory + "-heading"}
          initial={reduceMotion ? false : { opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-5 flex items-center justify-between gap-3"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
              Teaching Faculty
            </p>

            <h3 className="mt-1 text-xl font-extrabold text-navy-900 sm:text-2xl">
              {selectedCategory}
            </h3>
          </div>

          <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
            {loading ? "Loading…" : `${selectedTeachers.length} teachers`}
          </span>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
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
          <motion.div
            {...reveal}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center"
          >
            <p className="font-semibold text-slate-700">
              No published {selectedCategory.toLowerCase()} yet.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Add teachers in the admin dashboard and mark them as published.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={selectedCategory}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
          >
            {selectedTeachers.map((person, index) => {
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
                    delay: reduceMotion ? 0 : Math.min(index * 0.07, 0.28),
                    ease: "easeOut",
                  }}
                  whileHover={reduceMotion ? {} : { y: -5, scale: 1.01 }}
                  className="group relative mx-auto flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:border-amber-200 hover:shadow-xl"
                >
                  {/* Animated top accent */}
                  <div className="h-1.5 overflow-hidden bg-slate-100">
                    <motion.div
                      initial={reduceMotion ? false : { x: "-100%" }}
                      animate={{ x: "0%" }}
                      transition={{
                        duration: 0.6,
                        delay: reduceMotion ? 0 : index * 0.06,
                      }}
                      className="h-full w-full bg-gradient-to-r from-amber-500 to-orange-400"
                    />
                  </div>

                  {/* Circular animated teacher photo */}
                  <div className="flex justify-center px-2 pt-6 sm:pt-7">
                    <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28">
                      <motion.div
                        aria-hidden="true"
                        animate={reduceMotion ? {} : { rotate: 360 }}
                        transition={{
                          duration: 22,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="absolute -inset-1 rounded-full border-2 border-dashed border-amber-400"
                      />

                      <div className="absolute inset-0 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md ring-1 ring-slate-200">
                        {photo ? (
                          <motion.img
                            src={photo}
                            alt={person.name}
                            loading="lazy"
                            decoding="async"
                            whileHover={reduceMotion ? {} : { scale: 1.1 }}
                            transition={{ duration: 0.35 }}
                            className="block h-full w-full rounded-full object-cover object-top"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center rounded-full bg-navy-800 text-2xl font-extrabold text-white">
                            {person.name
                              .split(/\s+/)
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part[0]?.toUpperCase())
                              .join("")}
                          </div>
                        )}
                      </div>

                      <span className="absolute bottom-1 right-0 h-4 w-4 rounded-full border-[3px] border-white bg-amber-500" />
                    </div>
                  </div>

                  {/* Teacher details — no Faculty Profile label or arrow */}
                  <div className="flex flex-1 flex-col p-4 text-center sm:p-5">
                    <h4 className="min-h-10 break-words text-sm font-bold text-slate-900">
                      {person.name}
                    </h4>

                    <p className="mt-1 break-words text-xs font-semibold leading-5 text-amber-700 sm:text-sm">
                      {person.designation}
                    </p>

                    {person.subject?.trim() ? (
                      <p className="mt-3 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-600 sm:text-sm">
                        <span className="font-semibold text-slate-700">
                          Subject:{" "}
                        </span>
                        {person.subject}
                      </p>
                    ) : null}
                  </div>

                  {/* Animated bottom accent */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileHover={reduceMotion ? {} : { scaleX: 1 }}
                    transition={{ duration: 0.25 }}
                    className="absolute bottom-0 left-0 h-1 w-full origin-left bg-amber-500"
                  />
                </motion.article>
              );
            })}
          </motion.div>
        )}
      </section>
    </div>
  );
}
