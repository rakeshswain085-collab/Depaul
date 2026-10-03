import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { InfoCard, PageHero, Section, SectionHeading } from "@/components/ui";
import { ACADEMICS, SCHOOL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Academics",
  description:
    "Academic programmes at De-Paul Senior Secondary School, Aska – primary, middle, secondary and senior secondary education under CBSE.",
};

const STAGES = [
  {
    stage: "Pre-Primary & Primary",
    classes: "Nursery – Class V",
    detail:
      "Play-way and activity based learning, phonics and language development, number sense, art, rhymes and storytelling.",
  },
  {
    stage: "Middle School",
    classes: "Class VI – Class VIII",
    detail:
      "English, Odia / Hindi, Mathematics, Science, Social Science, Computer Literacy, Physical Education and Work Experience.",
  },
  {
    stage: "Secondary",
    classes: "Class IX – Class X",
    detail:
      "CBSE prescribed curriculum with continuous assessment, laboratory work, project based learning and board examination preparation.",
  },
  {
    stage: "Senior Secondary",
    classes: "Class XI – Class XII",
    detail:
      "Science stream (Physics, Chemistry, Mathematics / Biology, English) and Commerce stream (Accountancy, Business Studies, Economics, English).",
  },
];

export default function AcademicsPage() {
  return (
    <>
      <PageHero
        breadcrumb="Academics"
        title="Academic Programmes"
        subtitle="A structured CBSE curriculum delivered by qualified teachers from the foundational years to Class XII."
      />

      <Section>
        <div className="grid gap-6 md:grid-cols-3">
          {ACADEMICS.map((item) => (
            <InfoCard key={item.title} icon={item.icon} title={item.title}>
              {item.description}
            </InfoCard>
          ))}
        </div>

        <div className="mt-14 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy-800 text-white">
              <tr>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider">
                  Classes
                </th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider">
                  Curriculum highlights
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {STAGES.map((row) => (
                <tr key={row.stage} className="align-top">
                  <td className="px-5 py-4 font-bold text-navy-800">{row.stage}</td>
                  <td className="px-5 py-4 font-semibold text-gold-700">
                    {row.classes}
                  </td>
                  <td className="px-5 py-4 text-slate-600">{row.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section className="bg-navy-900">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="relative h-72 overflow-hidden rounded-2xl shadow-xl sm:h-96">
            <Image
              src="/images/science-lab.jpg"
              alt="Science laboratory"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div>
            <SectionHeading
              eyebrow="Teaching & Learning"
              title="How we teach"
              tone="dark"
              align="left"
              description="Lessons combine explanation, practice and application. Teachers use demonstrations, group work and project tasks so that concepts are understood rather than memorised."
            />
            <ul className="mt-6 space-y-3 text-sm text-navy-200">
              {[
                "Continuous assessment through class tests and term examinations",
                "Remedial support for students who need extra help",
                "Laboratory practicals for Science from the middle school onwards",
                "Smart classroom support for difficult topics",
                "Career and higher-education guidance for senior secondary students",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="text-gold-300">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/book-list"
                className="rounded-lg bg-gold-400 px-6 py-3 text-sm font-bold uppercase tracking-wider text-navy-900 transition hover:bg-gold-300"
              >
                Book List 2026-27
              </Link>
              <Link
                href="/notices"
                className="rounded-lg bg-white/10 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white ring-1 ring-white/30 transition hover:bg-white/20"
              >
                Examination Notices
              </Link>
            </div>
            <p className="mt-6 text-xs text-navy-300">
              Affiliated to {SCHOOL.board} &middot; Affiliation No.{" "}
              {SCHOOL.affiliation}
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
