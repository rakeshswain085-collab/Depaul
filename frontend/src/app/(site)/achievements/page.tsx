
import type { Metadata } from "next";
import { SiteImage } from "@/components/site-image-provider";
import { InfoCard, PageHero, Section, SectionHeading } from "@/components/ui";
import { ACHIEVEMENTS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Achievements & Activities",
  description:
    "Student achievements in academics, sports, cultural activities and science innovation at De-Paul Senior Secondary School, Aska.",
};

const ACTIVITIES = [
  "Annual Function & Cultural Evening",
  "Annual Sports Meet",
  "Science Exhibition",
  "Independence Day & Republic Day",
  "Inter-house competitions",
  "Drawing, essay & debate contests",
  "Children's Day celebrations",
  "Educational excursions",
];

export default function AchievementsPage() {
  return (
    <>
      {/* ---------------- PAGE HERO ---------------- */}
      <PageHero
        breadcrumb="Achievements"
        title="Achievements & Activities"
        subtitle="Our students bring the same enthusiasm to the stage, the field and the laboratory as they do to the classroom."
      />

      {/* ---------------- ACHIEVEMENTS ---------------- */}
      <Section className="py-6 sm:py-9 lg:py-12">
        <SectionHeading
          eyebrow="Our Success"
          title="Achievements & Activities"
          description="Celebrating student accomplishments in academics, sports, culture and innovation."
        />

        <div className="mt-5 grid grid-cols-2 items-stretch gap-2.5 sm:mt-7 sm:gap-4 lg:mt-9 lg:grid-cols-4 lg:gap-5">
          {ACHIEVEMENTS.map((item) => (
            <div
              key={item.title}
              className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300 hover:border-amber-300 hover:shadow-md sm:rounded-2xl sm:p-4 lg:p-5"
            >
              <InfoCard
                icon={item.icon}
                title={item.title}
              >
                {item.description}
              </InfoCard>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------------- STUDENT LIFE ---------------- */}
      <Section className="bg-navy-900 py-7 sm:py-10 lg:py-12">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-center lg:gap-10">
          {/* Activities */}
          <div className="min-w-0">
            <SectionHeading
              eyebrow="Student Life"
              title="Beyond the Classroom"
              tone="dark"
              align="left"
              description="School activities encourage students to participate, develop confidence and discover their talents."
            />

            <ul className="mt-4 grid grid-cols-1 gap-2.5 text-xs text-navy-200 min-[420px]:grid-cols-2 sm:mt-6 sm:gap-3 sm:text-sm">
              {ACTIVITIES.map((item) => (
                <li
                  key={item}
                  className="flex min-w-0 items-start gap-2 rounded-lg bg-navy-800/60 px-3 py-2.5 ring-1 ring-navy-700/70"
                >
                  <span
                    className="mt-0.5 shrink-0 text-gold-300"
                    aria-hidden="true"
                  >
                    ★
                  </span>
                  <span className="leading-5">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Activity Images */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-1">
            <div className="group relative h-36 overflow-hidden rounded-xl border border-white/10 shadow-lg sm:h-48 lg:h-56 lg:rounded-2xl">
              <SiteImage
                slot="cultural"
                alt="Students participating in a cultural programme"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              <p className="absolute bottom-2 left-2 text-xs font-bold text-white sm:bottom-3 sm:left-3 sm:text-sm">
                Cultural Programmes
              </p>
            </div>

            <div className="group relative h-36 overflow-hidden rounded-xl border border-white/10 shadow-lg sm:h-48 lg:h-56 lg:rounded-2xl">
              <SiteImage
                slot="sports"
                alt="Students participating in school sports"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              <p className="absolute bottom-2 left-2 text-xs font-bold text-white sm:bottom-3 sm:left-3 sm:text-sm">
                Sports & Games
              </p>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
