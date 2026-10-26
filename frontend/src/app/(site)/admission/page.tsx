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
    {
      icon: "📝",
      title: "Application",
      body: settings.admission_application,
    },
    {
      icon: "📅",
      title: "Schedule",
      body: settings.admission_schedule,
    },
    {
      icon: "📄",
      title: "Documents",
      body: settings.admission_documents,
    },
    {
      icon: "📞",
      title: "Enquiry",
      body: settings.admission_contact,
    },
  ];

  return (
    <>
      <PageHero
        breadcrumb="Admission"
        title="Admission Information"
        subtitle={settings.admission_intro}
      />

      <Section>
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid min-w-0 grid-cols-1 items-start gap-5 sm:gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-7 xl:gap-9">
            {/* LEFT COLUMN: Admission information */}
            <div className="min-w-0">
              <SectionHeading
                eyebrow="Important Information"
                title="How to Apply"
                align="left"
                description="Please review the admission information below or contact the school office for the current session."
              />

              {/* Information cards */}
              <div className="mt-4 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:gap-4">
                {info.map((item) => (
                  <article
                    key={item.title}
                    className="group min-w-0 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md sm:p-4"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-lg"
                        aria-hidden="true"
                      >
                        {item.icon}
                      </span>

                      <h3 className="text-sm font-bold text-navy-800 sm:text-base">
                        {item.title}
                      </h3>
                    </div>

                    <p className="mt-2 break-words text-xs leading-5 text-slate-600 sm:text-[13px] sm:leading-[1.6]">
                      {item.body}
                    </p>
                  </article>
                ))}
              </div>

              {/* School contact information */}
              <div className="mt-4 rounded-xl bg-navy-800 p-4 text-white sm:p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Admission Enquiry
                </h3>

                <p className="mt-2 text-xs leading-5 text-slate-200 sm:text-sm">
                  For admission-related information, contact the school office
                  during working hours or submit the enquiry form.
                </p>

                <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                  <a
                    href={`tel:${SCHOOL.phoneHref}`}
                    className="flex min-w-0 items-start gap-2 hover:text-amber-300"
                  >
                    <span aria-hidden="true">☎</span>
                    <span className="break-words">{SCHOOL.phone}</span>
                  </a>

                  <a
                    href={`mailto:${SCHOOL.email}`}
                    className="flex min-w-0 items-start gap-2 hover:text-amber-300"
                  >
                    <span aria-hidden="true">✉</span>
                    <span className="break-all">{SCHOOL.email}</span>
                  </a>

                  <p className="flex min-w-0 items-start gap-2 leading-5 sm:col-span-2">
                    <span aria-hidden="true">⌖</span>
                    <span className="break-words">{SCHOOL.address}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Enquiry form and office timings */}
            <div className="min-w-0 space-y-4">
              <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4 lg:p-4">
                <EnquiryForm />
              </div>

              {/* Office timings */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-navy-700">
                    Office Timings
                  </h3>

                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-800">
                    Office Hours
                  </span>
                </div>

                <div className="mt-3 divide-y divide-slate-200">
                  <div className="flex items-center justify-between gap-3 py-2 text-xs sm:text-sm">
                    <span className="text-slate-600">Monday – Friday</span>
                    <span className="shrink-0 font-semibold text-navy-800">
                      8:00 AM – 3:00 PM
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-2 text-xs sm:text-sm">
                    <span className="text-slate-600">Saturday</span>
                    <span className="shrink-0 font-semibold text-navy-800">
                      8:00 AM – 1:00 PM
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-2 text-xs sm:text-sm">
                    <span className="text-slate-600">Sunday &amp; Holidays</span>
                    <span className="shrink-0 font-semibold text-red-600">
                      Closed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}