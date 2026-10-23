import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section, SectionHeading } from "@/components/ui";
import { MANDATORY_DISCLOSURE, SCHOOL } from "@/lib/site";

export const metadata: Metadata = {
  title: "School Affiliation",
  description:
    "CBSE affiliation details of De-Paul Senior Secondary School, Aska – affiliation number 1530153.",
};

export default function AffiliationPage() {
  return (
    <>
      <PageHero
        breadcrumb="Affiliation"
        title="School Affiliation"
        subtitle="De-Paul Senior Secondary School, Aska is affiliated with the Central Board of Secondary Education, New Delhi."
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
          <div className="rounded-2xl bg-navy-800 p-8 text-center text-white shadow-lg">
            <p className="text-5xl font-extrabold tracking-tight">CBSE</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-gold-300">
              {SCHOOL.board}
            </p>
            <div className="mt-8 rounded-xl bg-white/10 p-5 ring-1 ring-white/20">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gold-300">
                Affiliation No.
              </p>
              <p className="mt-1 text-3xl font-extrabold">{SCHOOL.affiliation}</p>
            </div>
            <p className="mt-8 text-xs leading-relaxed text-navy-200">
              Parents may verify the affiliation status of the school on the
              official CBSE website using the affiliation number above.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-slate-200 bg-white">
                {[
                  { label: "School", value: `${SCHOOL.name}` },
                  { label: "Location", value: "Aska, Ganjam, Odisha" },
                  { label: "Board", value: "CBSE, New Delhi" },
                  { label: "Affiliation Number", value: SCHOOL.affiliation },
                  { label: "Classes", value: "Pre-Nursery to Class XII" },
                  { label: "Streams", value: "Science" },
                  { label: "Medium", value: "English" },
                ].map((row) => (
                  <tr key={row.label}>
                    <th className="w-1/3 bg-slate-50 px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      {row.label}
                    </th>
                    <td className="px-5 py-4 font-semibold text-navy-800">
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-gold-200 bg-gold-50 p-7">
          <SectionHeading
            eyebrow="Official Information"
            title="School particulars"
            align="left"
            description="Key particulars of the school as per official records."
          />
          <div className="mt-6 overflow-hidden rounded-xl bg-white">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-slate-200">
                {MANDATORY_DISCLOSURE.map((row) => (
                  <tr key={row.label}>
                    <th className="w-1/2 bg-slate-50 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                      {row.label}
                    </th>
                    <td className="px-5 py-3.5 font-semibold text-navy-800">
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/mandatory-disclosure"
              className="rounded-lg bg-navy-800 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-navy-700"
            >
              Mandatory Disclosure
            </Link>
            <Link
              href="/book-list"
              className="rounded-lg border border-navy-800 px-6 py-3 text-sm font-bold uppercase tracking-wider text-navy-800 transition hover:bg-navy-800 hover:text-white"
            >
              Book List 2026-27
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
