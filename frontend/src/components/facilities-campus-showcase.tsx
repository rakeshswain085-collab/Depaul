"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteImage } from "@/components/site-image-provider";
import type { SiteImageKey } from "@/lib/site-images";

type CampusPhoto = {
  id: number | string;
  imageUrl: string;
  title?: string;
  caption?: string;
};

type ShowcaseItem = {
  id: string;
  icon: string;
  imageSlot: SiteImageKey | null;
  slug: string;
  title: string;
  description: string;
  photos: CampusPhoto[];
};

function CampusPhotoImage({
  src,
  slot,
  title,
  className,
  fill = false,
}: {
  src?: string;
  slot: SiteImageKey | null;
  title: string;
  className: string;
  fill?: boolean;
}) {
  const [unavailable, setUnavailable] = useState(false);
  const placeholder = (
    <div
      role="img"
      aria-label={`${title} photo unavailable`}
      className={`flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 p-4 text-center text-sm font-semibold text-slate-600 ${className}`}
    >
      {title} photos will appear here when uploaded.
    </div>
  );

  if (unavailable || (!src && !slot)) {
    return placeholder;
  }

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={title}
        className={className}
        loading="lazy"
        decoding="async"
        onError={() => setUnavailable(true)}
      />
    );
  }

  if (!slot) return placeholder;

  return (
    <SiteImage
      slot={slot}
      alt={title}
      fill={fill}
      className={className}
      onError={() => setUnavailable(true)}
    />
  );
}

function CampusShowcaseCard({ item }: { item: ShowcaseItem }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const photoCount = item.photos.length;
  const activePhoto = item.photos[activeIndex];

  useEffect(() => {
    if (photoCount < 2) return;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % photoCount);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [photoCount]);

  return (
    <article className="group min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:rounded-2xl">
      <Link
        href={`/facilities/photos#${item.slug}`}
        aria-label={`View all ${item.title} photos`}
        className="block h-full"
      >
        <div className="relative h-40 w-full overflow-hidden bg-slate-200 text-left min-[480px]:h-36 sm:h-48 lg:h-60">
          <CampusPhotoImage
            key={activePhoto?.id ?? item.imageSlot}
            src={activePhoto?.imageUrl}
            slot={item.imageSlot}
            title={item.title}
            fill
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />

          <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg shadow-sm">
            {item.icon || "🏫"}
          </span>
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
          <span className="absolute bottom-3 left-3 rounded-full bg-slate-950/65 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {photoCount > 0
              ? `${photoCount} photo${photoCount === 1 ? "" : "s"} · View`
              : "Add photos in Gallery"}
          </span>
          {photoCount > 1 && (
            <span className="absolute bottom-4 right-3 flex gap-1" aria-hidden="true">
              {item.photos.map((photo, index) => (
                <span
                  key={photo.id}
                  className={`h-1.5 w-1.5 rounded-full ${
                    index === activeIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </span>
          )}
        </div>

        <div className="p-3.5 sm:p-4 lg:p-5">
          <h3 className="text-sm font-bold leading-5 text-navy-800 sm:text-base lg:text-lg">
            {item.title}
          </h3>
          <p className="mt-1.5 text-xs leading-5 text-slate-600 sm:mt-2 sm:text-sm sm:leading-6">
            {item.description}
          </p>
          <p className="mt-3 text-xs font-bold text-blue-700 group-hover:text-blue-900">
            View all photos →
          </p>
        </div>
      </Link>
    </article>
  );
}

export function FacilitiesCampusShowcase({
  items,
}: {
  items: ShowcaseItem[];
}) {
  return (
    <div className="mt-5 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:mt-7 sm:gap-5 lg:mt-9 lg:gap-6">
      {items.map((item) => (
        <CampusShowcaseCard key={item.id} item={item} />
      ))}
    </div>
  );
}
