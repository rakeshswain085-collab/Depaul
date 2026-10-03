import type { Metadata } from "next";
import { GalleryViewer } from "@/components/gallery-viewer";
import { PageHero, Section } from "@/components/ui";
import { getGalleryPhotos, groupPhotos } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Photo Gallery",
  description:
    "Photographs of the campus, activities, events and memories of De-Paul Senior Secondary School, Aska.",
};

export default function GalleryPage() {
  const groups = groupPhotos(getGalleryPhotos());
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <>
      <PageHero
        breadcrumb="Gallery"
        title="School Gallery"
        subtitle={`${total} photograph${total === 1 ? "" : "s"} across our school folders. Click a folder to open it, then browse with Next and Previous.`}
      />
      <Section className="bg-slate-50">
        {groups.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            No photographs have been published yet.
          </p>
        ) : (
          <GalleryViewer groups={groups} />
        )}
      </Section>
    </>
  );
}
