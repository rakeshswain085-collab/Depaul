import type { Metadata } from "next";
import { EnquiryForm } from "@/components/enquiry-form";
import { PageHero, Section, SectionHeading } from "@/components/ui";
import { getSettings } from "@/lib/queries";
import { SCHOOL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Admission",
  description:
    "Admission information, procedure, schedule and enquiry details for De-Paul Senior Secondary School, Aska.",
};

export default function AdmissionPage() {
  const settings = getSettings();

  const info = [
    { icon: "📝", title: "Application", body: settings.admission_application },
    { icon: "📅", title: "Schedule", body: settings.admission_schedule },
    { icon: "📄", title: "Documents", body: settings.admission_documents },
    { icon: "📞", title: "Enquiry", body: settings.admission_contact },
  ];

  return (
    <>
      <PageHero
        breadcrumb="Admission"
        title="Admission Information"
        subtitle={settings.admission_intro}
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <SectionHeading
              eyebrow="Important Information"
              title="How to apply"
              align="left"
              description="Parents are requested to read the information below and contact the school office for the current session."
            />
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {info.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <span className="text-2xl" aria-hidden>
                    {item.icon}
                  </span>
                  <h3 className="mt-3 text-base font-bold text-navy-800">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-xl bg-navy-800 p-6 text-white">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gold-300">
                Admission Enquiry
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-navy-100">
                For admission-related information, parents may contact the school
                office during working hours or submit the enquiry form on this
                page.
              </p>
              <div className="mt-5 space-y-1 text-sm font-semibold">
                <p>📞 {SCHOOL.phone}</p>
                <p>✉️ {SCHOOL.email}</p>
                <p>📍 {SCHOOL.address}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <EnquiryForm />
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-navy-700">
                Office timings
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li className="flex justify-between gap-4">
                  <span>Monday – Friday</span>
                  <span className="font-semibold text-navy-800">
                    8:00 AM – 3:00 PM
                  </span>
                </li>
                <li className="flex justify-between gap-4">
                  <span>Saturday</span>
                  <span className="font-semibold text-navy-800">
                    8:00 AM – 1:00 PM
                  </span>
                </li>
                <li className="flex justify-between gap-4">
                  <span>Sunday &amp; Holidays</span>
                  <span className="font-semibold text-navy-800">Closed</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
