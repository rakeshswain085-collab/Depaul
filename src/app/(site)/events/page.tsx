import type { Metadata } from "next";
import Image from "next/image";
import { EventCard, PageHero, Section, SectionHeading } from "@/components/ui";
import { formatLongDate, getEvents } from "@/lib/queries";

export const metadata: Metadata = {
  title: "School Events",
  description:
    "Upcoming and recent events at De-Paul Senior Secondary School, Aska – exhibitions, sports, annual function and celebrations.",
};

export default function EventsPage() {
  const events = getEvents();
  const upcoming = events.filter((event) => event.status.toLowerCase() === "upcoming");
  const completed = events.filter((event) => event.status.toLowerCase() !== "upcoming");
  const featured = events[0];

  return (
    <>
      <PageHero
        breadcrumb="Events"
        title="School Events"
        subtitle="Happenings, celebrations and academic activities that keep our campus alive through the year."
      />

      {featured ? (
        <Section>
          <div className="grid gap-8 overflow-hidden rounded-2xl border border-slate-200 shadow-sm lg:grid-cols-2">
            <div className="relative h-64 lg:h-full">
              <Image
                src={featured.imageUrl ?? "/images/cultural.jpg"}
                alt={featured.title}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="p-7">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600">
                Featured &middot; {featured.status}
              </p>
              <h2 className="mt-3 text-2xl font-extrabold text-navy-800">
                {featured.title}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                {featured.description}
              </p>
              <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-4">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Date
                  </dt>
                  <dd className="text-sm font-semibold text-navy-800">
                    {formatLongDate(featured.eventDate)}
                  </dd>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Venue
                  </dt>
                  <dd className="text-sm font-semibold text-navy-800">
                    {featured.venue}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </Section>
      ) : null}

      <Section className="bg-slate-50">
        <SectionHeading
          eyebrow="Happenings"
          title="Upcoming Events"
          align="left"
          description="Events scheduled for the coming months."
        />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500 sm:col-span-2 lg:col-span-3">
              No upcoming events are scheduled at present.
            </p>
          ) : (
            upcoming.map((event) => <EventCard key={event.id} event={event} />)
          )}
        </div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Looking Back"
          title="Recently Celebrated"
          align="left"
          description="A glimpse of the events our school family has celebrated."
        />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {completed.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500 sm:col-span-2 lg:col-span-3">
              Completed events will appear here.
            </p>
          ) : (
            completed.map((event) => <EventCard key={event.id} event={event} />)
          )}
        </div>
      </Section>
    </>
  );
}
