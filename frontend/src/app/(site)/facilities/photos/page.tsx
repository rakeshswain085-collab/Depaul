import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section } from "@/components/ui";
import { getCampusFacilities } from "@/lib/campus-facilities";
import { getGalleryPhotos } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Campus Photo Gallery",
  description:
    "Browse campus photographs by facilities category at De-Paul Senior Secondary School, Asika.",
};

export default async function CampusPhotosPage() {
  const [campusFacilities, galleryPhotos] = await Promise.all([
    getCampusFacilities(),
    getGalleryPhotos(),
  ]);
  const categories = campusFacilities.map((item) => ({
    ...item,
    photos: galleryPhotos.filter(
      (photo) => photo.category === item.photoCategory,
    ),
  }));
  const totalPhotos = categories.reduce(
    (total, category) => total + category.photos.length,
    0,
  );

  return (
    <>
      <PageHero
        breadcrumb="Campus Photos"
        title="Campus Photo Gallery"
        subtitle={`${totalPhotos} campus photo${totalPhotos === 1 ? "" : "s"} across ${categories.length} categories. Browse the collections below.`}
      />

      <Section className="bg-slate-50 py-6 sm:py-9 lg:py-12">
        <nav
          aria-label="Campus photo categories"
          className="mb-8 flex gap-2 overflow-x-auto pb-2"
        >
          {categories.map((category) => (
            <a
              key={category.slug}
              href={`#${category.slug}`}
              className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-400 hover:text-navy-800"
            >
              {category.title}
              <span className="ml-2 text-xs text-slate-400">
                {category.photos.length}
              </span>
            </a>
          ))}
        </nav>

        <div className="space-y-12">
          {categories.map((category) => (
            <section
              key={category.slug}
              id={category.slug}
              className="scroll-mt-24"
            >
              <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-navy-800 sm:text-2xl">
                    {category.title}
                  </h2>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                    {category.description}
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-500">
                  {category.photos.length} photo
                  {category.photos.length === 1 ? "" : "s"}
                </span>
              </header>

              {category.photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                  {category.photos.map((photo) => (
                    <figure
                      key={photo.id}
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                    >
                      <a
                        href={photo.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-square overflow-hidden bg-slate-100"
                        aria-label={`Open full-size photo: ${photo.title || category.title}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.imageUrl}
                          alt={photo.title || category.title}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </a>
                      {(photo.title || photo.caption) && (
                        <figcaption className="p-3">
                          {photo.title && (
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {photo.title}
                            </p>
                          )}
                          {photo.caption && (
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                              {photo.caption}
                            </p>
                          )}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                  No photos have been added to this category yet.
                </p>
              )}
            </section>
          ))}
        </div>

        <div className="mt-12 border-t border-slate-200 pt-6">
          <Link
            href="/facilities"
            className="text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            ← Back to Facilities
          </Link>
        </div>
      </Section>
    </>
  );
}
