
import type { Metadata } from "next";
import Link from "next/link";
import { SiteImage } from "@/components/site-image-provider";
import {
  InfoCard,
  PageHero,
  Section,
  SectionHeading,
} from "@/components/ui";
import { ACADEMICS, SCHOOL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Academics",
  description:
    "Academic programmes at De-Paul Senior Secondary School, Aska – primary, middle, secondary and senior secondary education under CBSE.",
};

const STAGES = [
  {
    stage: "Pre-Primary & Primary",
    classes: "Pre-Nursery – Class V",
    detail:
      "Play-way and activity-based learning, phonics and language development, number sense, art, rhymes and storytelling.",
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
      "CBSE prescribed curriculum with continuous assessment, laboratory work, project-based learning and board examination preparation.",
  },
  {
    stage: "Senior Secondary",
    classes: "Class XI – Class XII",
    detail:
      "Science stream (Physics, Chemistry, Mathematics, English / Biology / Computer Science).",
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

      {/* Academic Programme Cards */}
      <Section className="py-8 sm:py-10 lg:py-14">

<div className="grid grid-cols-2 items-stretch gap-2.5 sm:gap-4 lg:grid-cols-3 lg:gap-5">
  {ACADEMICS.map((item) => (
    <InfoCard
      key={item.title}
      icon={item.icon}
      title={item.title}
    >
      {item.description}
    </InfoCard>
  ))}
</div>


        {/* Curriculum Overview */}
        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:mt-10 sm:rounded-2xl lg:mt-12">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600 sm:text-xs">
              Learning Pathway
            </p>

            <h2 className="mt-1 text-lg font-extrabold text-navy-800 sm:text-xl">
              Curriculum Overview
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              Explore the learning stages and their curriculum highlights.
            </p>
          </div>

          {/* Scrollable on small screens */}
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[620px] table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[25%]" />
                <col className="w-[23%]" />
                <col className="w-[52%]" />
              </colgroup>

              <thead className="bg-navy-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider sm:px-5 sm:text-xs">
                    Stage
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider sm:px-5 sm:text-xs">
                    Classes
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider sm:px-5 sm:text-xs">
                    Curriculum Highlights
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {STAGES.map((row) => (
                  <tr
                    key={row.stage}
                    className="align-top transition-colors hover:bg-amber-50/40"
                  >
                    <td className="px-4 py-4 font-bold leading-5 text-navy-800 sm:px-5">
                      {row.stage}
                    </td>

                    <td className="px-4 py-4 font-semibold leading-5 text-amber-700 sm:px-5">
                      {row.classes}
                    </td>

                    <td className="px-4 py-4 leading-6 text-slate-600 sm:px-5">
                      {row.detail}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-[10px] text-slate-500 sm:px-6 sm:text-xs">
            Swipe horizontally to view all curriculum details on mobile.
          </div>
        </div>
      </Section>

      {/* Teaching & Learning */}
      <Section className="bg-navy-900 py-8 sm:py-12 lg:py-16">
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
          {/* Science Laboratory Image */}
          <div className="relative h-48 overflow-hidden rounded-xl shadow-lg sm:h-72 sm:rounded-2xl lg:h-[400px]">
            <SiteImage
              slot="scienceLab"
              alt="Science laboratory at De-Paul Senior Secondary School"
              fill
              className="object-cover transition-transform duration-700 hover:scale-[1.03]"
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-950/35 via-transparent to-transparent" />
          </div>

          {/* Teaching Information */}
          <div className="min-w-0">
            <SectionHeading
              eyebrow="Teaching & Learning"
              title="How We Teach"
              tone="dark"
              align="left"
              description="Lessons combine explanation, practice and application. Teachers use demonstrations, group work and project tasks so that concepts are understood rather than memorised."
            />

            <ul className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">
              {[
                "Continuous assessment through class tests and term examinations",
                "Remedial support for students who need extra help",
                "Laboratory practicals for Science from the middle school onwards",
                "Smart classroom support for difficult topics",
                "Career and higher-education guidance for senior secondary students",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-xs leading-5 text-navy-100 sm:text-sm sm:leading-6"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-xs font-bold text-amber-300">
                    ✓
                  </span>

                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {/* Responsive Buttons */}
            <div className="mt-6 grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:mt-8 sm:flex">
              <Link
                href="/book-list"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-gold-400 px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-navy-900 transition-colors hover:bg-gold-300 sm:px-5 sm:text-sm"
              >
                Book List 2026–27
              </Link>

              <Link
                href="/notices"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white/10 px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-white ring-1 ring-inset ring-white/25 transition-colors hover:bg-white/20 sm:px-5 sm:text-sm"
              >
                Examination Notices
              </Link>
            </div>

            <p className="mt-5 border-t border-white/10 pt-4 text-[10px] leading-5 text-navy-200 sm:mt-6 sm:text-xs">
              Affiliated to {SCHOOL.board}
              <span className="mx-2 text-amber-400">•</span>
              Affiliation No. {SCHOOL.affiliation}
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
