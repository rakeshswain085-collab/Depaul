import type { Metadata } from "next";
import Image from "next/image";
import { InfoCard, PageHero, Section, SectionHeading } from "@/components/ui";
import { ACHIEVEMENTS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Achievements & Activities",
  description:
    "Student achievements in academics, sports, cultural activities and science innovation at De-Paul Senior Secondary School, Aska.",
};

export default function AchievementsPage() {
  return (
    <>
      <PageHero
        breadcrumb="Achievements"
        title="Achievements & Activities"
        subtitle="Our students bring the same enthusiasm to the stage, the field and the laboratory as they do to the classroom."
      />

      <Section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ACHIEVEMENTS.map((item) => (
            <InfoCard key={item.title} icon={item.icon} title={item.title}>
              {item.description}
            </InfoCard>
          ))}
        </div>
      </Section>

      <Section className="bg-navy-900">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Student Life"
              title="Beyond the classroom"
              tone="dark"
              align="left"
              description="Every year the school calendar includes celebrations and competitions that give every child a chance to take part."
            />
            <ul className="mt-6 grid gap-3 text-sm text-navy-200 sm:grid-cols-2">
              {[
                "Annual Function & Cultural Evening",
                "Annual Sports Meet",
                "Science Exhibition",
                "Independence Day & Republic Day",
                "Inter-house competitions",
                "Drawing, essay & debate contests",
                "Children's Day celebrations",
                "Educational excursions",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-gold-300">★</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-4">
            <div className="relative h-56 overflow-hidden rounded-2xl shadow-xl">
              <Image
                src="/images/cultural.jpg"
                alt="Cultural programme"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="relative h-56 overflow-hidden rounded-2xl shadow-xl">
              <Image
                src="/images/sports.jpg"
                alt="Sports day"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
