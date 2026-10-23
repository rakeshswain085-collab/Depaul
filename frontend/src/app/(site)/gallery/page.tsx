
import type { Metadata } from "next";
import { GalleryViewer } from "@/components/gallery-viewer";
import { PageHero, Section } from "@/components/ui";
import { getGalleryPhotos } from "@/lib/gallery";
import { groupPhotos } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Photo Gallery",
  description:
    "Photographs of the campus, activities, events and memories of De-Paul Senior Secondary School, Aska.",
};

export default async function GalleryPage() {
  const photos = await getGalleryPhotos();
  const groups = groupPhotos(photos);

  // Sort years in descending order so the latest year appears first.
  const sortedGroups = [...groups].sort((a, b) => {
    const yearA = Number(
      a.category.match(/\b(?:19|20)\d{2}\b/)?.[0] ?? 0,
    );
    const yearB = Number(
      b.category.match(/\b(?:19|20)\d{2}\b/)?.[0] ?? 0,
    );

    return yearB - yearA || b.category.localeCompare(a.category);
  });

  const total = sortedGroups.reduce(
    (sum, group) => sum + group.items.length,
    0,
  );

  return (
    <>
      <PageHero
        breadcrumb="Gallery"
        title="School Gallery"
        subtitle={`${total} photograph${total === 1 ? "" : "s"} across our school folders. Browse photographs by year, with the latest year shown first.`}
      />

      <Section className="bg-slate-50">
        {sortedGroups.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            No photographs have been published yet.
          </p>
        ) : (
          <GalleryViewer groups={sortedGroups} />
        )}
      </Section>
    </>
  );
}
