
"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

export type GalleryItem = {
  id: number | string;
  title?: string;
  imageUrl: string;
  caption?: string;
  category?: string;
  year?: number | string;
};

export type GalleryGroup = {
  category: string;
  items: GalleryItem[];
};

function extractYear(value: string): number {
  const match = value.match(/\b(?:19|20)\d{2}\b/);
  return match ? Number(match[0]) : 0;
}

export function GalleryViewer({ groups }: { groups: GalleryGroup[] }) {
  const sortedGroups = useMemo(
    () =>
      [...groups].sort(
        (a, b) =>
          extractYear(b.category) - extractYear(a.category) ||
          b.category.localeCompare(a.category),
      ),
    [groups],
  );

  // Automatically open the latest year when the gallery loads.
  const [activeYear, setActiveYear] = useState<string | null>(null);

  const latestYear = sortedGroups[0]?.category ?? "";

  const selectedYear =
    activeYear && sortedGroups.some((group) => group.category === activeYear)
      ? activeYear
      : latestYear;

  const activeGroup =
    sortedGroups.find((group) => group.category === selectedYear) ??
    sortedGroups[0];

  if (!activeGroup) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <p className="text-lg font-semibold text-slate-800">
          No photographs available
        </p>
        <p className="mt-2 text-sm text-slate-500">
          School gallery photos will appear here when they are published.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Year folders */}
      <section aria-label="Browse gallery by year">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-700">
              Photo archive
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Browse by year
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select a year to explore its photographs.
            </p>
          </div>

          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
            {sortedGroups.length}{" "}
            {sortedGroups.length === 1 ? "year" : "years"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {sortedGroups.map((group, index) => {
            const isLatest = group.category === latestYear;
            const isActive = group.category === selectedYear;
            const year = extractYear(group.category);
            const preview = group.items[0];

            return (
              <button
                key={group.category}
                type="button"
                onClick={() => setActiveYear(group.category)}
                aria-pressed={isActive}
                className={`group relative overflow-hidden rounded-2xl border text-left transition duration-200 focus:outline-none focus:ring-4 focus:ring-amber-200 ${
                  isActive
                    ? "border-amber-500 bg-amber-50 shadow-md ring-2 ring-amber-200"
                    : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
                }`}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  {preview ? (
                    <Image
                      src={preview.imageUrl}
                      alt={`School gallery ${group.category}`}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl text-slate-300">
                      ▧
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                  {isLatest && (
                    <span className="absolute left-2 top-2 rounded-full bg-amber-400 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-slate-950 shadow-sm">
                      Latest Year
                    </span>
                  )}

                  <span className="absolute bottom-2 left-3 text-2xl font-bold tracking-tight text-white drop-shadow">
                    {year || group.category}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 px-3 py-3">
                  <span className="text-xs font-semibold text-slate-600">
                    {group.items.length}{" "}
                    {group.items.length === 1 ? "photo" : "photos"}
                  </span>

                  <span
                    className={`text-xs font-bold ${
                      isActive ? "text-amber-700" : "text-slate-400"
                    }`}
                  >
                    {isActive ? "Viewing" : "View"} →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Selected year photos */}
      <section aria-live="polite">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                {extractYear(activeGroup.category) || activeGroup.category}
              </h2>

              {activeGroup.category === latestYear && (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Latest Year
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {activeGroup.items.length}{" "}
              {activeGroup.items.length === 1
                ? "photograph"
                : "photographs"}{" "}
              in this year
            </p>
          </div>
        </div>

        {activeGroup.items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            No photographs are available for this year yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activeGroup.items.map((item, index) => (
              <article
                key={item.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <Image
                    src={item.imageUrl}
                    alt={item.title || `School photograph ${index + 1}`}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />

                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent opacity-80" />

                  <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold text-slate-700">
                    {item.category || "School Gallery"}
                  </span>
                </div>

                {(item.title || item.caption) && (
                  <div className="p-4">
                    {item.title && (
                      <h3 className="text-sm font-bold text-slate-900">
                        {item.title}
                      </h3>
                    )}

                    {item.caption && (
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {item.caption}
                      </p>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
