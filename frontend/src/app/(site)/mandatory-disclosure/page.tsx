
import type { Metadata } from "next";
import { PageHero, Section } from "@/components/ui";
import { MANDATORY_DISCLOSURE, SCHOOL } from "@/lib/site";
import GeneralInformationRows from "@/components/mandatory-disclosure/GeneralInformationRows";
import PublicStaffDirectory from "@/components/mandatory-disclosure/PublicStaffDirectory";
import PublicDisclosureDocuments from "@/components/mandatory-disclosure/PublicDisclosureDocuments";
import PublicResultsAcademics from "@/components/mandatory-disclosure/PublicResultsAcademics";

export const metadata: Metadata = {
  title: "Mandatory Disclosure",
  description:
    "Mandatory public disclosure of De-Paul Senior Secondary School, Aska, including certificates, academic results, staff information and school infrastructure.",
};

const INFRASTRUCTURE = [
  { label: "Total Campus Area", value: "8,305 sq. mtr." },
  { label: "Number of Classrooms", value: "19" },
  { label: "Classroom Size", value: "60.47 sq. mtr." },
  { label: "Composite Science Laboratory", value: "1 — 87.79 sq. mtr." },
  { label: "Computer Laboratory", value: "1 — 60.47 sq. mtr." },
  { label: "Mathematics Laboratory", value: "1 — 46.82 sq. mtr." },
  { label: "Internet Facility", value: "Yes" },
  { label: "Girls' Toilets", value: "12" },
  { label: "Boys' Toilets", value: "08" },
];

const INSPECTION_VIDEO =
  "https://youtube.com/shorts/Oe0hNT0qmbA?feature=shared";

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-7">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
        {title}
      </h2>

      {description && (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}

function DisclosureTable({
  rows,
}: {
  rows: { label: string; value: string }[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <dl className="divide-y divide-slate-100">
        {rows.map((row, index) => (
          <div
            key={row.label}
            className={`grid gap-2 px-5 py-4 sm:grid-cols-2 sm:gap-6 ${
              index % 2 === 0 ? "bg-white" : "bg-slate-50/70"
            }`}
          >
            <dt className="text-xs font-bold uppercase leading-5 tracking-wide text-slate-500">
              {row.label}
            </dt>

            <dd className="text-sm font-semibold leading-6 text-navy-800 sm:text-right">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function MandatoryDisclosurePage() {
  return (
    <>
      <PageHero
        breadcrumb="Mandatory Disclosure"
        title="Mandatory Public Disclosure"
        subtitle="Transparent access to school information, statutory certificates, academic records, staff details and infrastructure."
      />

      <Section>
        <div className="mx-auto max-w-6xl space-y-14">
          {/* 01 — GENERAL INFORMATION */}
          <section>
            <SectionHeading
              eyebrow="01 — School Details"
              title="General Information"
              description="Official information about De-Paul Senior Secondary School, Aska."
            />

            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
              <div className="bg-navy-800 px-5 py-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-amber-300">
                  School Information
                </h3>
              </div>

              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-slate-200 bg-white">
                  <GeneralInformationRows
                    fallbackRows={MANDATORY_DISCLOSURE}
                  />
                </tbody>
              </table>
            </div>
          </section>

          {/* 02 — DOCUMENTS AND CERTIFICATES */}
          <section>
            <SectionHeading
              eyebrow="02 — Statutory Documents"
              title="Documents & Certificates"
              description="Access the school's affiliation documents, statutory certificates and other mandatory records."
            />

            <PublicDisclosureDocuments />
          </section>

          {/* 03 — RESULTS AND ACADEMICS */}
          <section id="results-academics">
            <SectionHeading
              eyebrow="03 — Academic Records"
              title="Results & Academics"
              description="Academic records, fee structure and examination results."
            />

            {/*
              Shows published PDF academic records and the student-results
              link provided by PublicResultsAcademics.
              The duplicate large Examination Results card is removed.
            */}
            <PublicResultsAcademics />
          </section>

          {/* 04 — STAFF INFORMATION */}
          <section>
            <SectionHeading
              eyebrow="04 — Human Resources"
              title="Staff Information"
              description="Teaching staff, school leadership and student-teacher ratio."
            />

            <PublicStaffDirectory />
          </section>

          {/* 05 — SCHOOL INFRASTRUCTURE */}
          <section>
            <SectionHeading
              eyebrow="05 — Campus Facilities"
              title="School Infrastructure"
              description="Campus area, classrooms, laboratories, sanitation facilities and digital connectivity."
            />

            <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Campus Area",
                  value: "8,305",
                  unit: "sq. mtr.",
                },
                {
                  label: "Classrooms",
                  value: "19",
                  unit: "Rooms",
                },
                {
                  label: "Science Lab",
                  value: "87.79",
                  unit: "sq. mtr.",
                },
                {
                  label: "Computer Lab",
                  value: "60.47",
                  unit: "sq. mtr.",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {item.label}
                  </p>

                  <p className="mt-3 text-2xl font-extrabold text-navy-800">
                    {item.value}
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-400">
                    {item.unit}
                  </p>
                </div>
              ))}
            </div>

            <DisclosureTable rows={INFRASTRUCTURE} />
          </section>

          {/* SCHOOL INSPECTION VIDEO */}
          <section>
            <div className="overflow-hidden rounded-2xl bg-navy-900 text-white shadow-lg">
              <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
                    Campus Inspection
                  </p>

                  <h2 className="mt-3 text-xl font-extrabold sm:text-2xl">
                    Explore Our School Infrastructure
                  </h2>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                    Watch the school inspection video covering the campus and
                    infrastructure facilities of De-Paul Senior Secondary
                    School.
                  </p>
                </div>

                <a
                  href={INSPECTION_VIDEO}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 rounded-xl bg-amber-400 px-6 py-4 text-sm font-bold text-navy-950 transition-colors hover:bg-amber-300"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Watch Inspection Video
                </a>
              </div>
            </div>
          </section>

          {/* PUBLIC INFORMATION AND ENQUIRIES */}
          <section>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-navy-700 shadow-sm">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>

                <div>
                  <h2 className="text-lg font-extrabold text-navy-800">
                    Public Information & Enquiries
                  </h2>

                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Parents and members of the public may contact the school
                    administration for additional information regarding
                    mandatory disclosures, certificates, academic records and
                    school facilities.
                  </p>

                  <a
                    href={`mailto:${SCHOOL.email}`}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-navy-700 underline decoration-amber-500 decoration-2 underline-offset-4 hover:text-amber-700"
                  >
                    {SCHOOL.email}
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>
      </Section>
    </>
  );
}
