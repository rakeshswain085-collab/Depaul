"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

export type GalleryItem = {
  id: number;
  title: string;
  imageUrl: string;
  caption?: string;
};

export type GalleryGroup = {
  category: string;
  items: GalleryItem[];
};

export function GalleryViewer({ groups }: { groups: GalleryGroup[] }) {
  const firstCategory = groups[0]?.category ?? "";
  const [active, setActive] = useState(firstCategory);
  const [index, setIndex] = useState<number | null>(null);

  const items = useMemo(
    () => groups.find((group) => group.category === active)?.items ?? [],
    [groups, active],
  );

  const total = items.length;

  const step = (delta: number) => {
    if (index === null) return;
    setIndex((index + delta + total) % total);
  };

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((group) => {
          const isActive = group.category === active;
          return (
            <button
              key={group.category}
              type="button"
              onClick={() => {
                setActive(group.category);
                setIndex(null);
              }}
              className={`group overflow-hidden rounded-xl border text-left transition ${
                isActive
                  ? "border-gold-400 shadow-xl"
                  : "border-slate-200 hover:-translate-y-1 hover:shadow-lg"
              }`}
            >
              <div className="relative h-40 w-full overflow-hidden bg-navy-800">
                <Image
                  src={group.items[0]?.imageUrl ?? "/images/campus.jpg"}
                  alt={group.items[0]?.title ?? group.category}
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-900/85 to-navy-900/10" />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-gold-300">
                    📁 {group.category}
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {group.items.length} photo{group.items.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
        {active ? `${active} — ${total} photo${total === 1 ? "" : "s"}` : ""}
      </p>

      {total > 0 ? (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(itemIndex)}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-gold-300 hover:shadow-xl"
            >
              <div className="relative h-52 w-full overflow-hidden bg-slate-100">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <p className="text-sm font-bold text-navy-800">{item.title}</p>
                {item.caption ? (
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {item.caption}
                  </p>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          No photographs have been published in this folder yet.
        </p>
      )}

      {index !== null && items[index] ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-navy-900/90 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setIndex(null)}
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(clickEvent) => clickEvent.stopPropagation()}
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black">
              <Image
                src={items[index].imageUrl}
                alt={items[index].title}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-white">
              <div>
                <p className="text-base font-bold">{items[index].title}</p>
                <p className="text-xs text-navy-200">{items[index].caption}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold ring-1 ring-white/25 transition hover:bg-white/20"
                >
                  ‹ Previous
                </button>
                <span className="text-xs text-navy-200">
                  {index + 1} / {total}
                </span>
                <button
                  type="button"
                  onClick={() => step(1)}
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold ring-1 ring-white/25 transition hover:bg-white/20"
                >
                  Next ›
                </button>
                <button
                  type="button"
                  onClick={() => setIndex(null)}
                  className="rounded-lg bg-gold-400 px-4 py-2 text-sm font-bold text-navy-900 transition hover:bg-gold-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
