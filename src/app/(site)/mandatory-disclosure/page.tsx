
import type { Metadata } from "next";
import { PageHero, Section } from "@/components/ui";
import { MANDATORY_DISCLOSURE, SCHOOL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Mandatory Disclosure",
  description:
    "Mandatory public disclosure of De-Paul Senior Secondary School, Aska, including certificates, academic results, staff information and school infrastructure.",
};

const DOCUMENTS = [
  {
    category: "General Documents",
    items: [
      {
        label: "Affiliation / Upgradation Letter and Recent Extension of Affiliation",
        href: "https://depaulschoolaska.in/sitepad-data/uploads//2021/11/1-COPIES-OF-AFFILIATION-LETTER-AND-RECENT-EXTENSION-OF-AFFILIATION.pdf",
      },
      {
        label: "Society / Trust Registration Certificate",
        href: "https://depaulschoolaska.in/sitepad-data/uploads//2021/11/2-COPIES-OF-SOCIETIES-REGISTRATOIN-CERTIFICATE.pdf",
      },
      {
        label: "No Objection Certificate (NOC)",
        href: "https://depaulschoolaska.in/sitepad-data/uploads//2021/11/3-COPIES-OF-NO-OBJECTION-CERTIFICATE.pdf",
      },
      {
        label: "Recognition Certificate under RTE Act, 2009",
        href: "https://depaulschoolaska.in/?page_id=601",
      },
      {
        label: "Building Safety Certificate",
        href: "",
      },
      {
        label: "Valid Fire Safety Certificate",
        href: "",
      },
      {
        label: "DEO Certificate / Self Certification by School",
        href: "https://depaulschoolaska.in/sitepad-data/uploads//2021/11/7-SELF-CERTIFICATION-BY-SCHOOL.pdf",
      },
      {
        label: "Water, Health and Sanitation Certificates",
        href: "https://ibb.co/jdpBJpD",
      },
    ],
  },
];

const ACADEMIC_LINKS = [
  {
    label: "Fee Structure of the School",
    href: "https://depaulschoolaska.in/fee-structure/",
    description: "School fee details",
  },
  {
    label: "Annual Academic Calendar",
    href: "https://depaulschoolaska.in/acad-cal/",
    description: "Academic schedule and important dates",
  },
  {
    label: "School Management Committee (SMC)",
    href: "https://depaulschoolaska.in/smc/",
    description: "List of committee members",
  },
  {
    label: "Parent Teacher Association (PTA)",
    href: "https://depaulschoolaska.in/PTA/",
    description: "List of PTA members",
  },
  {
    label: "Last Three Years Board Examination Results",
    href: "https://depaulschoolaska.in/?page_id=585",
    description: "CBSE board examination results",
  },
];

const STAFF = [
  { label: "Principal", value: "Ms. Rajani Panda" },
  { label: "PGT Teachers", value: "00" },
  { label: "TGT Teachers", value: "18" },
  { label: "PRT Teachers", value: "06" },
  { label: "Teacher Section Ratio", value: "1:21" },
  {
    label: "Special Educator",
    value: "Ms. Narmada Senapati, TGT",
  },
  {
    label: "Counsellor and Wellness Teacher",
    value: "Mr. Santosh Kumar Mishra, TGT",
  },
];

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

const inspectionVideo =
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
      <div className="divide-y divide-slate-100">
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
      </div>
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

          {/* GENERAL INFORMATION */}
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
                  {MANDATORY_DISCLOSURE.map((row, index) => (
                    <tr
                      key={row.label}
                      className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    >
                      <th className="w-full px-5 py-4 text-xs font-bold uppercase leading-5 tracking-wide text-slate-500 sm:w-1/2">
                        {row.label}
                      </th>
                      <td className="px-5 py-4 font-semibold leading-6 text-navy-800">
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* DOCUMENTS AND CERTIFICATES */}
          <section>
            <SectionHeading
              eyebrow="02 — Statutory Documents"
              title="Documents & Certificates"
              description="Access the school's affiliation documents, statutory certificates and other mandatory records."
            />

            <div className="space-y-6">
              {DOCUMENTS.map((group) => (
                <div
                  key={group.category}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-navy-800">
                      {group.category}
                    </h3>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {group.items.map((item, index) => (
                      <div
                        key={item.label}
                        className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-amber-50/50 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              className="h-5 w-5"
                              aria-hidden="true"
                            >
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <path d="M14 2v6h6M8 13h8M8 17h8" />
                            </svg>
                          </div>

                          <div>
                            <p className="text-sm font-semibold leading-6 text-navy-800">
                              {item.label}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              Official school document
                            </p>
                          </div>
                        </div>

                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`View ${item.label}`}
                          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-amber-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-amber-700 transition-all hover:border-amber-600 hover:bg-amber-600 hover:text-white"
                        >
                          View Document
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="h-4 w-4"
                            aria-hidden="true"
                          >
                            <path d="M7 17 17 7M7 7h10v10" />
                          </svg>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* RESULTS AND ACADEMICS */}
          <section>
            <SectionHeading
              eyebrow="03 — Academic Records"
              title="Results & Academics"
              description="Academic information, examination results, school fees and committee records."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {ACADEMIC_LINKS.map((item, index) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 transition-colors group-hover:bg-amber-100 group-hover:text-amber-700">
                    <span className="text-lg font-bold">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold leading-5 text-navy-800">
                      {item.label}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.description}
                    </p>
                  </div>

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5 shrink-0 text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-amber-600"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14m-6-6 6 6-6 6" />
                  </svg>
                </a>
              ))}
            </div>
          </section>

          {/* STAFF INFORMATION */}
          <section>
            <SectionHeading
              eyebrow="04 — Human Resources"
              title="Staff Information"
              description="Teaching staff, school leadership and student-teacher ratio."
            />

            <div className="mb-5 grid gap-4 sm:grid-cols-3">
              {[
                { label: "PGT", value: "00" },
                { label: "TGT", value: "18" },
                { label: "PRT", value: "06" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    {item.label} Teachers
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-navy-800">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <DisclosureTable rows={STAFF} />
          </section>

          {/* SCHOOL INFRASTRUCTURE */}
          <section>
            <SectionHeading
              eyebrow="05 — Campus Facilities"
              title="School Infrastructure"
              description="Campus area, classrooms, laboratories, sanitation facilities and digital connectivity."
            />

            <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Campus Area", value: "8,305", unit: "sq. mtr." },
                { label: "Classrooms", value: "19", unit: "Rooms" },
                { label: "Science Lab", value: "87.79", unit: "sq. mtr." },
                { label: "Computer Lab", value: "60.47", unit: "sq. mtr." },
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
                    infrastructure facilities of De-Paul Senior Secondary School.
                  </p>
                </div>

                <a
                  href={inspectionVideo}
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

          {/* ADDITIONAL INFORMATION */}
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