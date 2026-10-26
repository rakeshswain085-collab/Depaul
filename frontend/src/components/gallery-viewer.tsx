
"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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

  const latestYear = sortedGroups[0]?.category ?? "";

  const [activeYear, setActiveYear] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);

  const selectedYear =
    activeYear && sortedGroups.some((group) => group.category === activeYear)
      ? activeYear
      : latestYear;

  const activeGroup =
    sortedGroups.find((group) => group.category === selectedYear) ??
    sortedGroups[0];

  const activePhotos = activeGroup?.items ?? [];

  const closeViewer = useCallback(() => {
    setSelectedPhoto(null);
  }, []);

  const showPrevious = useCallback(() => {
    setSelectedPhoto((current) => {
      if (current === null || activePhotos.length === 0) return current;
      return (current - 1 + activePhotos.length) % activePhotos.length;
    });
  }, [activePhotos.length]);

  const showNext = useCallback(() => {
    setSelectedPhoto((current) => {
      if (current === null || activePhotos.length === 0) return current;
      return (current + 1) % activePhotos.length;
    });
  }, [activePhotos.length]);

  useEffect(() => {
    if (selectedPhoto === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeViewer();
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPhoto, closeViewer, showPrevious, showNext]);

  if (!activeGroup) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center sm:rounded-3xl sm:px-6 sm:py-20">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-3xl text-slate-400">
          ▧
        </div>

        <h2 className="mt-4 text-lg font-bold text-slate-900 sm:mt-5 sm:text-xl">
          No photographs available
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          School gallery photos will appear here when published.
        </p>
      </div>
    );
  }

  const currentPhoto =
    selectedPhoto === null ? null : activePhotos[selectedPhoto];

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* COMPACT YEAR NAVIGATION */}
      <section aria-label="Browse gallery by year">
        <div className="mb-4 flex items-end justify-between gap-3 sm:mb-6 sm:gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-800 sm:text-xs sm:tracking-[0.24em]">
              Explore our memories
            </p>

            <h2 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 sm:mt-2 sm:text-3xl">
              Browse by year
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500 sm:mt-2 sm:text-sm sm:leading-6">
              Select a year to explore photographs.
            </p>
          </div>

          <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 sm:px-4 sm:py-2 sm:text-xs">
            {sortedGroups.length}{" "}
            {sortedGroups.length === 1 ? "year" : "years"}
          </span>
        </div>

        {/* Horizontal scrolling on mobile, grid on desktop */}
        <div className="-mx-4 overflow-x-auto overscroll-x-contain px-4 pb-2 sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
          <div className="flex w-max gap-2 sm:grid sm:w-full sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {sortedGroups.map((group, index) => {
              const isLatest = group.category === latestYear;
              const isActive = group.category === selectedYear;
              const year = extractYear(group.category);
              const preview = group.items[0];

              return (
                <button
                  key={group.category}
                  type="button"
                  onClick={() => {
                    setActiveYear(group.category);
                    setSelectedPhoto(null);
                  }}
                  aria-pressed={isActive}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className={`gallery-enter group relative w-max shrink-0 rounded-full border px-4 py-2.5 text-sm font-semibold transition duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 sm:w-full sm:overflow-hidden sm:rounded-2xl sm:p-0 sm:text-left ${
                    isActive
                      ? "border-blue-800 bg-blue-800 text-white shadow-md sm:border-blue-800"
                      : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 sm:hover:-translate-y-1 sm:hover:shadow-lg"
                  }`}
                >
                  {/* Compact mobile version */}
                  <span className="flex items-center gap-2 sm:hidden">
                    {year || group.category}

                    {isLatest && (
                      <span className={isActive ? "text-blue-100" : "text-blue-700"}>
                        ★
                      </span>
                    )}
                  </span>

                  {/* Image cards on larger screens */}
                  <span className="relative hidden aspect-[5/3] overflow-hidden bg-slate-200 sm:block">
                    {preview ? (
                      <Image
                        src={preview.imageUrl}
                        alt={`School gallery ${group.category}`}
                        fill
                        unoptimized
                        sizes="(max-width: 1024px) 33vw, 20vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-3xl text-slate-400">
                        ▧
                      </span>
                    )}

                    <span className="absolute inset-0 bg-gradient-to-t from-[#071b35]/90 via-[#071b35]/10 to-transparent" />

                    {isLatest && (
                      <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-blue-900 shadow-sm">
                        Latest
                      </span>
                    )}

                    <span className="absolute bottom-3 left-3 right-3 text-xl font-bold text-white drop-shadow sm:text-2xl">
                      {year || group.category}
                    </span>
                  </span>

                  <span
                    className={`hidden items-center justify-between gap-2 px-3 py-3 sm:flex ${
                      isActive ? "bg-blue-50" : "bg-white"
                    }`}
                  >
                    <span className="truncate text-xs font-semibold text-slate-600">
                      {group.items.length}{" "}
                      {group.items.length === 1 ? "photo" : "photos"}
                    </span>

                    <span
                      className={`text-xs ${
                        isActive ? "text-blue-800" : "text-slate-400"
                      }`}
                    >
                      {isActive ? "Selected ✓" : "View →"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* SELECTED COLLECTION */}
      <section aria-live="polite">
        <div className="mb-4 flex items-end justify-between gap-3 border-b border-slate-200 pb-3 sm:mb-7 sm:gap-4 sm:pb-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="h-6 w-1 shrink-0 rounded-full bg-blue-800 sm:h-8" />

              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {activeGroup.category}
              </h2>

              {activeGroup.category === latestYear && (
                <span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-blue-800 sm:px-3 sm:text-[10px]">
                  Latest
                </span>
              )}
            </div>

            <p className="mt-2 pl-3 text-xs text-slate-500 sm:text-sm">
              {activePhotos.length}{" "}
              {activePhotos.length === 1 ? "photograph" : "photographs"}
            </p>
          </div>

          <span className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[9px] font-bold tracking-wide text-slate-600 sm:rounded-xl sm:px-4 sm:py-2 sm:text-xs">
            {String(activePhotos.length).padStart(2, "0")} PHOTOS
          </span>
        </div>

        {activePhotos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center sm:rounded-3xl sm:px-6 sm:py-16">
            <p className="text-base font-semibold text-slate-800 sm:text-lg">
              No photographs in this collection
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Please check back when photos have been published.
            </p>
          </div>
        ) : (
          /* Two columns on mobile, three on desktop */
          <div className="grid grid-cols-2 items-start gap-2.5 sm:gap-4 lg:grid-cols-3 lg:gap-5">
            {activePhotos.map((item, index) => (
              <article
                key={item.id}
                className="gallery-enter group min-w-0"
                style={{
                  animationDelay: `${Math.min(index * 45, 450)}ms`,
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedPhoto(index)}
                  aria-label={`Open photograph: ${
                    item.title || `School photograph ${index + 1}`
                  }`}
                  className="relative block w-full overflow-hidden rounded-xl bg-slate-200 text-left shadow-sm transition duration-300 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 sm:rounded-2xl"
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.title || `School photograph ${index + 1}`}
                    width={800}
                    height={600}
                    unoptimized
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                    className="h-auto w-full transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                  />

                  <span className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent opacity-60 sm:h-24" />

                  <span className="absolute left-2 top-2 rounded-full border border-white/30 bg-black/30 px-2 py-1 text-[9px] font-bold text-white backdrop-blur-sm sm:left-3 sm:top-3 sm:text-[10px]">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/40 bg-black/25 text-sm text-white backdrop-blur-md transition sm:bottom-3 sm:right-3 sm:h-9 sm:w-9 sm:text-base">
                    ↗
                  </span>
                </button>

                {(item.title || item.caption) && (
                  <div className="px-0.5 pb-2 pt-2 sm:px-1 sm:pt-3">
                    {item.title && (
                      <h3 className="line-clamp-2 text-xs font-bold leading-5 text-slate-800 sm:text-sm">
                        {item.title}
                      </h3>
                    )}

                    {item.caption && (
                      <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500 sm:text-sm sm:leading-6">
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

      {/* FULL-SCREEN PHOTO VIEWER */}
      {currentPhoto && selectedPhoto !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020813]/95 p-3 backdrop-blur-md sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Photograph viewer"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeViewer();
          }}
        >
          <button
            type="button"
            onClick={closeViewer}
            aria-label="Close photograph"
            className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-2xl text-white transition hover:bg-white/20 sm:right-7 sm:top-7 sm:h-11 sm:w-11"
          >
            ×
          </button>

          <div className="absolute left-4 top-5 text-[11px] font-semibold tracking-wide text-white/70 sm:left-8 sm:top-8 sm:text-xs">
            {selectedPhoto + 1} / {activePhotos.length}
            <span className="ml-3 hidden sm:inline">
              {activeGroup.category}
            </span>
          </div>

          <div className="relative flex h-full max-h-[78vh] w-full max-w-6xl items-center justify-center sm:max-h-[85vh]">
            <button
              type="button"
              onClick={showPrevious}
              aria-label="Previous photograph"
              className="absolute left-0 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/40 text-2xl text-white transition hover:bg-white/20 sm:-left-5 sm:h-11 sm:w-11"
            >
              ‹
            </button>

            <div className="relative flex h-full w-full items-center justify-center">
              <Image
                src={currentPhoto.imageUrl}
                alt={
                  currentPhoto.title ||
                  `School photograph ${selectedPhoto + 1}`
                }
                width={1800}
                height={1200}
                unoptimized
                priority
                className="max-h-full max-w-[calc(100%-4.5rem)] object-contain"
              />
            </div>

            <button
              type="button"
              onClick={showNext}
              aria-label="Next photograph"
              className="absolute right-0 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/40 text-2xl text-white transition hover:bg-white/20 sm:-right-5 sm:h-11 sm:w-11"
            >
              ›
            </button>
          </div>

          {(currentPhoto.title || currentPhoto.caption) && (
            <div className="absolute bottom-4 left-12 right-12 text-center sm:bottom-7 sm:left-16 sm:right-16">
              {currentPhoto.title && (
                <h3 className="text-sm font-bold text-white sm:text-lg">
                  {currentPhoto.title}
                </h3>
              )}

              {currentPhoto.caption && (
                <p className="mx-auto mt-1 line-clamp-2 max-w-2xl text-xs leading-5 text-white/65 sm:text-sm sm:leading-6">
                  {currentPhoto.caption}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .gallery-enter {
          animation: gallery-enter 500ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
        }

        @keyframes gallery-enter {
          from {
            opacity: 0;
            transform: translateY(12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .gallery-enter {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
