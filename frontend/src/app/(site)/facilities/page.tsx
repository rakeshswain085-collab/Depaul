
import type { Metadata } from "next";
import { FacilitiesCampusShowcase } from "@/components/facilities-campus-showcase";
import { PageHero, Section, SectionHeading } from "@/components/ui";
import { getCampusFacilities } from "@/lib/campus-facilities";
import { getGalleryPhotos } from "@/lib/gallery";
import { FACILITIES } from "@/lib/site";

export const metadata: Metadata = {
  title: "Facilities",
  description:
    "Campus facilities at De-Paul Senior Secondary School, Asika – laboratories, library, smart learning, sports and transport.",
};

export const dynamic = "force-dynamic";

export default async function FacilitiesPage() {
  const [campusFacilities, galleryPhotos] = await Promise.all([
    getCampusFacilities(),
    getGalleryPhotos(),
  ]);
  const showcaseItems = campusFacilities.map((item) => ({
    id: item.id,
    slug: item.slug,
    icon: item.icon,
    imageSlot: item.imageSlot,
    title: item.title,
    description: item.description,
    photos: galleryPhotos
      .filter((photo) => photo.category === item.photoCategory)
      .map((photo, index) => ({
        id: photo.id ?? `${item.photoCategory}-${index}`,
        imageUrl: photo.imageUrl,
        title: photo.title,
        caption: photo.caption,
      })),
  }));

  return (
    <>
      {/* ---------------- PAGE HERO ---------------- */}
      <PageHero
        breadcrumb="Facilities"
        title="Campus & Facilities"
        subtitle="The school campus at Rankanath Vihar offers the spaces and resources children need for a complete school day."
      />

      {/* ---------------- CAMPUS SHOWCASE ---------------- */}
      <Section className="bg-slate-50 py-6 sm:py-9 lg:py-12">
        <SectionHeading
          eyebrow="A Look Around"
          title="Inside the Campus"
          description="Explore the spaces that support our students' learning and development."
        />

        <FacilitiesCampusShowcase items={showcaseItems} />
      </Section>

      {/* ---------------- FACILITIES ---------------- */}
      <Section className="py-6 sm:py-9 lg:py-12">
        <SectionHeading
          eyebrow="Campus"
          title="What We Provide"
          description="Safe, clean and well-maintained facilities that support learning inside and outside the classroom."
        />

        {/* Compact Facilities Cards */}
        <div className="mt-5 grid grid-cols-2 items-stretch gap-2.5 sm:mt-7 sm:gap-4 lg:mt-9 lg:grid-cols-3 lg:gap-5">
          {FACILITIES.map((item) => (
            <article
              key={item.title}
              className="group min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300 hover:border-amber-300 hover:shadow-md sm:rounded-2xl sm:p-5 lg:p-6"
            >
              {/* Icon */}
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-lg sm:h-11 sm:w-11 sm:text-xl">
                {item.icon}
              </div>

              {/* Title */}
              <h3 className="mt-3 text-sm font-bold leading-5 text-navy-800 sm:mt-4 sm:text-base sm:leading-6 lg:text-lg">
                {item.title}
              </h3>

              {/* Description */}
              <p className="mt-1.5 text-xs leading-5 text-slate-600 sm:mt-2 sm:text-sm sm:leading-6">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
