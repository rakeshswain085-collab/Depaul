import type { Metadata } from "next";
import Image from "next/image";
import { Crest } from "@/components/crest";
import {
  FeatureRow,
  InfoCard,
  PageHero,
  Section,
  SectionHeading,
} from "@/components/ui";
import { getMessage } from "@/lib/queries";
import { ACADEMICS, FACILITIES, SCHOOL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "About De-Paul Senior Secondary School, Aska – CBSE affiliated school in Ganjam, Odisha offering classes from Nursery to Class XII.",
};

export default function AboutPage() {
  const chairman = getMessage("chairman");
  const principal = getMessage("principal");

  return (
    <>
      <PageHero
        breadcrumb="About Us"
        title="About the School"
        subtitle="De-Paul Senior Secondary School, Aska has been serving the educational needs of the region for more than two decades."
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Our Story"
              title="A place to learn and grow"
              align="left"
              description={`${SCHOOL.name} was established in ${SCHOOL.established} at Rankanath Vihar, College Square, Nuagam in Aska, Ganjam. The school is affiliated to the Central Board of Secondary Education, New Delhi with affiliation number ${SCHOOL.affiliation}.`}
            />
            <p className="mt-5 text-sm leading-relaxed text-slate-600">
              From its earliest days the school has focused on giving children of
              Aska and the surrounding villages a disciplined, value-based
              education. Classrooms are kept deliberately welcoming so that every
              learner feels safe to ask questions, make mistakes and improve. Over
              the years the school has grown into a full senior secondary
              institution offering Science and Commerce streams at the higher
              secondary level.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Alongside academics, students take part in sports, cultural
              programmes, science exhibitions, debates and community activities so
              that they leave school as confident and responsible young people.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <FeatureRow icon="📍" label="Location" value="Aska, Ganjam, Odisha" />
              <FeatureRow icon="🎓" label="Board" value={SCHOOL.board} />
              <FeatureRow icon="🏷️" label="Affiliation No." value={SCHOOL.affiliation} />
              <FeatureRow icon="🏛️" label="Classes" value="Nursery to Class XII" />
            </div>
          </div>
          <div className="grid gap-4">
            <div className="relative h-64 overflow-hidden rounded-2xl shadow-lg sm:h-80">
              <Image
                src="/images/campus2.jpg"
                alt="School building"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="relative h-48 overflow-hidden rounded-2xl shadow-lg">
              <Image
                src="/images/campus1.jpg"
                alt="School library"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </Section>

      <Section className="bg-navy-900">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Our Vision",
              body: "To be a school where every child is known, valued and guided towards a purposeful life of learning and service.",
            },
            {
              title: "Our Mission",
              body: "To deliver quality CBSE education through committed teaching, disciplined routines, co-curricular opportunity and constant encouragement.",
            },
            {
              title: "Our Values",
              body: "Respect, honesty, responsibility, compassion and hard work — the values that shape daily life in our school.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl bg-navy-800/70 p-6 ring-1 ring-navy-700"
            >
              <Crest className="h-10 w-10" />
              <h3 className="mt-4 text-lg font-bold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-200">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </Section>


      <Section>
        <SectionHeading eyebrow="Programmes" title="What We Offer" />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {ACADEMICS.map((item) => (
            <InfoCard key={item.title} icon={item.icon} title={item.title}>
              {item.description}
            </InfoCard>
          ))}
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FACILITIES.slice(0, 3).map((item) => (
            <InfoCard key={item.title} icon={item.icon} title={item.title}>
              {item.description}
            </InfoCard>
          ))}
        </div>
      </Section>
    </>
  );
}
