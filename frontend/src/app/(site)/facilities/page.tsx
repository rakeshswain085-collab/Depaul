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
      <PageHero
        breadcrumb="Facilities"
        title="Campus & Facilities"
        subtitle="The school campus at Rankanath Vihar offers the spaces and resources children need for a complete school day."
      />

      <Section>
        <SectionHeading
          eyebrow="Campus"
          title="What we provide"
          description="Safe, clean and well-maintained facilities that support learning inside and outside the classroom."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FACILITIES.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-gold-300 hover:shadow-lg"
            >
              <span className="text-3xl" aria-hidden>
                {item.icon}
              </span>
              <h3 className="mt-4 text-lg font-bold text-navy-800">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-slate-50">
        <SectionHeading eyebrow="A Look Around" title="Inside the Campus" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {SHOWCASE.map((item) => (
            <article
              key={item.title}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="relative h-56">
                <SiteImage
                  slot={item.imageSlot}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-navy-800">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
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
