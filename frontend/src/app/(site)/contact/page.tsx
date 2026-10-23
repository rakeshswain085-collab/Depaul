import type { Metadata } from "next";
import Link from "next/link";
import { EnquiryForm } from "@/components/enquiry-form";
import { PageHero, Section, SectionHeading } from "@/components/ui";
import { MAPS_EMBED, MAPS_LINK, SCHOOL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact De-Paul Senior Secondary School, Aska – address, phone number, email, location map and enquiry form.",
};

export default function ContactPage() {
  const cards = [
    {
      icon: "📍",
      label: "Address",
      value: SCHOOL.address,
      href: MAPS_LINK,
    },
    { icon: "📞", label: "Phone", value: SCHOOL.phone, href: `tel:${SCHOOL.phoneHref}` },
    { icon: "✉️", label: "Email", value: SCHOOL.email, href: `mailto:${SCHOOL.email}` },
  ];

  return (
    <>
      <PageHero
        breadcrumb="Contact"
        title="Get in Touch"
        subtitle="We are glad to answer questions from parents, students and visitors. Reach us by phone, email or a visit to the campus."
      />

      <Section>
        <SectionHeading
          eyebrow="Contact"
          title="School Contact Details"
          description="The school office remains open on all working days. Please call before planning a visit."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <a
              key={card.label}
              href={card.href}
              target={card.label === "Address" ? "_blank" : undefined}
              rel={card.label === "Address" ? "noreferrer" : undefined}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-gold-300 hover:shadow-lg"
            >
              <span className="text-3xl" aria-hidden>
                {card.icon}
              </span>
              <p className="mt-3 text-xs font-bold uppercase tracking-widest text-gold-600">
                {card.label}
              </p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-navy-800">
                {card.value}
              </p>
            </a>
          ))}
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="relative h-96">
              <iframe
                title="School location map"
                src={MAPS_EMBED}
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="p-5">
              <h3 className="text-sm font-bold text-navy-800">
                📍 {SCHOOL.name}, Aska
              </h3>
              <p className="mt-1 text-sm text-slate-600">{SCHOOL.address}</p>
              <a
                href={MAPS_LINK}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block rounded-lg bg-navy-800 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-navy-700"
              >
                📍 Open in Google Maps
              </a>
            </div>
          </div>

          <div className="space-y-6">
            <EnquiryForm />
            <div className="rounded-xl bg-navy-900 p-6 text-white">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gold-300">
                Official links
              </h3>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={SCHOOL.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-gold-400 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-navy-900 transition hover:bg-gold-300"
                >
                  ▶ YouTube Channel
                </a>
                <a
                  href={SCHOOL.magazine}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-white/10 px-5 py-2.5 text-xs font-bold uppercase tracking-wider ring-1 ring-white/30 transition hover:bg-white/20"
                >
                  ▤ School Magazine
                </a>
                <Link
                  href="/affiliation"
                  className="rounded-full bg-white/10 px-5 py-2.5 text-xs font-bold uppercase tracking-wider ring-1 ring-white/30 transition hover:bg-white/20"
                >
                  Affiliation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
