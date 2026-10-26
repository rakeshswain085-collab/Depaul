
import type { Metadata } from "next";
import { SiteImage } from "@/components/site-image-provider";
import { PageHero, Section, SectionHeading } from "@/components/ui";
import { FACILITIES } from "@/lib/site";

export const metadata: Metadata = {
  title: "Facilities",
  description:
    "Campus facilities at De-Paul Senior Secondary School, Aska – laboratories, library, smart learning, sports and transport.",
};

const SHOWCASE = [
  {
    imageSlot: "scienceLab",
    title: "Science Laboratories",
    body: "Separate physics, chemistry and biology work areas where students perform experiments linked to their syllabus.",
  },
  {
    imageSlot: "library",
    title: "Library & Reading Room",
    body: "A calm reading space with story books, reference titles, newspapers and magazines for all age groups.",
  },
  {
    imageSlot: "sports",
    title: "Playground & Sports",
    body: "Open ground for athletics, football, kabaddi, volleyball and annual sports day competitions.",
  },
  {
    imageSlot: "cultural",
    title: "Auditorium & Stage",
    body: "A stage and assembly area used for cultural programmes, competitions, celebrations and school functions.",
  },
] as const;

export default function FacilitiesPage() {
  return (
    <>
      {/* ---------------- PAGE HERO ---------------- */}
      <PageHero
        breadcrumb="Facilities"
        title="Campus & Facilities"
        subtitle="The school campus at Rankanath Vihar offers the spaces and resources children need for a complete school day."
      />

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

      {/* ---------------- CAMPUS SHOWCASE ---------------- */}
      <Section className="bg-slate-50 py-6 sm:py-9 lg:py-12">
        <SectionHeading
          eyebrow="A Look Around"
          title="Inside the Campus"
          description="Explore the spaces that support our students' learning and development."
        />

        {/* Responsive Image Cards */}
        <div className="mt-5 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:mt-7 sm:gap-5 lg:mt-9 lg:gap-6">
          {SHOWCASE.map((item) => (
            <article
              key={item.title}
              className="group min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:rounded-2xl"
            >
              {/* Responsive Image */}
              <div className="relative h-40 overflow-hidden min-[480px]:h-36 sm:h-48 lg:h-60">
                <SiteImage
                  slot={item.imageSlot}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/25 to-transparent opacity-70" />
              </div>

              {/* Compact Details */}
              <div className="p-3.5 sm:p-4 lg:p-5">
                <h3 className="text-sm font-bold leading-5 text-navy-800 sm:text-base lg:text-lg">
                  {item.title}
                </h3>

                <p className="mt-1.5 text-xs leading-5 text-slate-600 sm:mt-2 sm:text-sm sm:leading-6">
                  {item.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
