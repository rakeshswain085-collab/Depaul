import Image from "next/image";
import Link from "next/link";
import { PublicEvents } from "@/components/public-events";
import { EnquiryForm } from "@/components/enquiry-form";
import { GalleryViewer } from "@/components/gallery-viewer";
import { LiveHomeNotices } from "@/components/live-home-notices";
import MeetOurTeachers from "@/components/meet-our-teachers";
import {
  EventCard,
  FeatureRow,
  InfoCard,
  Section,
  SectionHeading,
} from "@/components/ui";
import {
  getEvents,
  getGalleryPhotos,
  getMessage,
  getSettings,
  groupPhotos,
} from "@/lib/queries";
import {
  ACADEMICS,
  ACHIEVEMENTS,
  FACILITIES,
  MAPS_EMBED,
  MAPS_LINK,
  SCHOOL,
} from "@/lib/site";

export default async function HomePage() {
  const [events, galleryPhotos, chairman, principal, settings] = await Promise.all([
    getEvents(4),
    getGalleryPhotos(),
    getMessage("chairman"),
    getMessage("principal"),
    getSettings(),
  ]);
  const groups = groupPhotos(galleryPhotos);

  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section className="relative isolate overflow-hidden bg-navy-900">
        <Image
          src="/images/school-campus.png"
          alt="De-Paul Senior Secondary School campus"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-35"
        />
<div className="absolute inset-0 bg-gradient-to-r from-navy-950/55 via-navy-900/30 to-navy-900/10" />
  {/* Additional Soft Bottom Gradient */}
  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/50 via-transparent to-navy-900/10" />

  {/* Existing Hero Content */}
<div className="relative mx-auto grid max-w-7xl items-start gap-8 px-4 py-10 sm:py-14 lg:grid-cols-[1.4fr_0.9fr] lg:gap-12 lg:py-8">

          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full bg-gold-400/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-gold-300 ring-1 ring-gold-400/40">
              CBSE Affiliated &middot; Est. {SCHOOL.established}
            </p>
            <h1 className="mt-5 text-3xl font-extrabold uppercase leading-tight tracking-tight text-white sm:text-5xl">
              Welcome to De-Paul School, Aska
            </h1>
            <p className="mt-3 text-xl font-semibold text-gold-300">
              {SCHOOL.tagline}
            </p>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-navy-100 sm:text-base">
              A modern school website for announcements, events, photographs,
              leadership messages and official school information. We provide a
              welcoming educational environment where students are encouraged to
              learn, participate, develop confidence and grow with values.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="#events"
                className="rounded-lg bg-gold-400 px-6 py-3 text-sm font-bold uppercase tracking-wider text-navy-900 transition hover:bg-gold-300"
              >
                View School Events
              </Link>
              <Link
                href="#latest-notice"
                className="rounded-lg bg-white/10 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white ring-1 ring-white/30 transition hover:bg-white/20"
              >
                Latest Notice
              </Link>
              <Link
                href="/admission"
                className="rounded-lg bg-white/10 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white ring-1 ring-white/30 transition hover:bg-white/20"
              >
                Admission
              </Link>
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-2 rounded-lg bg-gold-400 px-6 py-3 text-sm font-bold uppercase tracking-wider text-navy-900 shadow-sm transition hover:bg-gold-300"
              >
                Admin Login
              </Link>
            </div>
            <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-white/15 pt-6 text-white">
              {[
                { value: "26+", label: "Years of Excellence" },
                { value: "600+", label: "Students" },
                { value: "Pre-Nur–XII", label: "Classes Offered" },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="text-2xl font-extrabold text-gold-300">
                    {stat.value}
                  </dt>
                  <dd className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-navy-200">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>



<aside className="mx-auto w-full max-w-[360px] min-w-0 overflow-hidden rounded-[24px] border border-white/30 bg-white/80 p-4 shadow-[0_16px_45px_rgba(0,0,0,0.12)] backdrop-blur-2xl transition-all duration-500 hover:bg-white/90 sm:p-5 lg:ml-auto lg:translate-x-19 lg:translate-y-15">

  {/* TOP: LOGO LEFT + CBSE DETAILS RIGHT */}
  <div className="grid min-w-0 grid-cols-[minmax(76px,0.75fr)_minmax(0,1.25fr)] items-center gap-3 sm:gap-5">

    {/* SCHOOL LOGO */}
    <div className="flex min-w-0 items-center justify-center border-r border-slate-200 pr-3 sm:pr-5">
      <img
        src="/images/school-logo.png"
        alt="De-Paul School Aska Logo"
className="h-auto w-full max-w-[115px] object-contain"
      />
    </div>

    {/* CBSE DETAILS */}
    <div className="min-w-0 py-2">

      <div className="flex flex-wrap items-center gap-2">
        <span 
        className="inline-flex shrink-0 items-center rounded-lg bg-navy-800 px-3 py-2 text-sm font-extrabold tracking-wide text-white shadow-md">
          CBSE
        </span>

        <span className="min-w-0 text-[10px] font-extrabold uppercase leading-snug tracking-wider text-navy-800 sm:text-xs md:text-sm">
          Affiliated School
        </span>
      </div>

      {/* AFFILIATION NUMBER */}
     <p className="mt-4 break-all text-3xl font-black leading-none tracking-tight text-navy-800 sm:text-4xl">
  {SCHOOL.affiliation}
</p>

      <p className="mt-2 text-[9px] font-bold uppercase leading-relaxed tracking-[0.16em] text-slate-500 sm:text-[11px] sm:tracking-[0.2em]">
        Affiliation Number
      </p>

    </div>
  </div>

  {/* DIVIDER */}
 <div className="my-4 border-t border-slate-200 sm:my-5" />

  {/* SCHOOL LOCATION */}
  <div className="flex min-w-0 items-center gap-3 sm:gap-5">



{/* SCHOOL NAME + LOCATION */}
<div className="min-w-0">
<h3 className="text-xl font-extrabold uppercase leading-tight tracking-wide text-navy-800 sm:text-2xl">
  DE-PAUL SCHOOL
</h3>

<p className="mt-1.5 text-sm font-medium text-slate-500 sm:text-base">
  Aska, Ganjam, Odisha
</p>
</div>

  </div>

  {/* AFFILIATION BUTTON */}
  <Link
    href="/affiliation"
    className="mt-5 flex min-h-12 w-full items-center justify-between gap-3 rounded-xl bg-navy-800 px-4 py-3 text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-navy-700 hover:shadow-xl"
    >
    <span className="text-xs font-extrabold uppercase tracking-wider sm:text-sm md:text-base">
      Affiliation Details
    </span>

    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6 shrink-0 sm:h-7 sm:w-7"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 12h14m-7-7 7 7-7 7"
      />
    </svg>
  </Link>

</aside>
   </div>
      </section>

      {/* ---------------- LIVE NOTICES ---------------- */}
      <LiveHomeNotices />

      {/* ---------------- ABOUT ---------------- */}
      <Section id="about">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="relative">
            <div className="relative h-72 overflow-hidden rounded-2xl shadow-xl sm:h-96">
              <Image
                src="/images/campus.jpg"
                alt="De-Paul School campus"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-6 left-6 rounded-xl bg-gold-400 px-5 py-3 shadow-lg">
              <p className="text-xs font-bold uppercase tracking-widest text-navy-900">
                Established
              </p>
              <p className="text-2xl font-extrabold text-navy-900">
                {SCHOOL.established}
              </p>
            </div>
          </div>
          <div>
            <SectionHeading
              eyebrow="About the School"
              title="Welcome to our school"
              align="left"
              description="De-Paul Senior Secondary School, Aska — we provide a welcoming educational environment where students are encouraged to learn, participate, develop confidence and grow with values."
            />
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <FeatureRow icon="📍" label="Location" value="Aska, Ganjam, Odisha" />
              <FeatureRow
                icon="🎓"
                label="Board"
                value="Central Board of Secondary Education"
              />
              <FeatureRow icon="🏷️" label="Affiliation No." value={SCHOOL.affiliation} />
              <FeatureRow icon="🏛️" label="Classes" value="Pre-Nursery to Class XII" />
            </div>
            <Link
              href="/about"
              className="mt-7 inline-block rounded-lg bg-navy-800 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-navy-700"
            >
              More About Us
            </Link>
          </div>
        </div>
      </Section>





{/* ---------------- LEADERSHIP MESSAGES (COMPACT) ---------------- */}
<Section
  id="messages"
  className="relative overflow-hidden bg-[#f4f7fb] py-10 sm:py-12"
>
  <div className="relative mx-auto max-w-5xl px-4 sm:px-6">

    {/* Heading */}
    <div className="mb-8 text-center">
      <h2 className="font-serif text-2xl font-bold text-[#10264b] sm:text-3xl">
        Messages from Our Leaders
      </h2>
      <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-amber-400" />
    </div>

    {/* Cards */}
    <div className="grid gap-6 md:grid-cols-2">
      {[
        { message: chairman, image: "/images/chairman.jpg" },
        { message: principal, image: "/images/principal.jpg" },
      ].map(({ message, image }) =>
        message ? (
          <article
            key={message.id}
            className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_6px_24px_rgba(15,40,75,0.07)]"
          >
            {/* Navy banner with overlapping round portrait */}
            <div className="relative h-20 bg-[#10264b]">
              {/* Gold slanted edge */}
              <div
                className="absolute inset-y-0 right-0 w-1/3 bg-amber-400"
                style={{ clipPath: "polygon(35% 0, 100% 0, 100% 100%, 0 100%)" }}
              />

              <div className="absolute inset-x-5 top-full flex -translate-y-1/2 items-end gap-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white bg-[#dce9f5] shadow-md ring-2 ring-amber-400">
                  <Image
                    src={image}
                    alt={message.name}
                    fill
                    sizes="96px"
                    className="object-cover object-top"
                  />
                </div>
              </div>

              {/* Name in the banner, right of the portrait */}
              <div className="absolute inset-y-0 left-[8.5rem] right-4 flex flex-col justify-center">
                <p className="truncate font-serif text-lg font-bold text-white">
                  {message.name}
                </p>
                <p className="text-xs font-medium text-amber-300">
                  {message.designation}
                </p>
              </div>
            </div>

            {/* Message */}
            <div className="px-5 pb-6 pt-14">
              <h3 className="font-serif text-lg font-bold leading-snug text-[#10264b]">
                {message.heading}
              </h3>

              <p className="mt-2 border-l-4 border-amber-400 pl-3 text-sm leading-6 text-slate-600 line-clamp-5">
                {message.body}
              </p>
            </div>
          </article>
        ) : null
      )}
    </div>

  </div>
</Section>

{/* ---------------- MEET OUR TEACHERS ---------------- */}
      <MeetOurTeachers />

      {/* ---------------- SCHOOL SOCIAL MEDIA ---------------- */}
<Section className="relative overflow-hidden bg-gradient-to-b from-gold-50 via-white to-white">

  {/* Decorative Background */}
  <div className="pointer-events-none absolute -right-20 top-10 h-64 w-64 rounded-full bg-gold-100/40 blur-3xl" />
  <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-blue-100/30 blur-3xl" />

  <div className="relative">

    <SectionHeading
      eyebrow="Stay Connected"
      title="Follow Our School Journey"
    />

    <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-7 text-slate-600 sm:text-base">
      Stay updated with school celebrations, student achievements,
      events, activities, and memorable moments from our campus.
    </p>

    <div className="mx-auto mt-12 grid max-w-5xl gap-7 md:grid-cols-2">

      {/* ---------------- YOUTUBE CARD ---------------- */}
      <a
        href={SCHOOL.youtube}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Visit De-Paul School Aska YouTube Channel"
        className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition-all duration-500 hover:-translate-y-2 hover:border-red-200 hover:shadow-[0_20px_50px_rgba(239,68,68,0.12)] sm:p-8"
      >
        {/* Top Accent */}
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-red-500 via-red-400 to-orange-300" />

        {/* Decorative Circle */}
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-red-50 transition-transform duration-500 group-hover:scale-150" />

        <div className="relative">

          <div className="flex items-start justify-between">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 transition-all duration-500 group-hover:scale-110 group-hover:bg-red-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-9 w-9"
                aria-hidden="true"
              >
                <path
                  fill="#FF0033"
                  d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8Z"
                />
                <path
                  fill="#FFFFFF"
                  d="m9.6 15.6 6.2-3.6-6.2-3.6v7.2Z"
                />
              </svg>
            </div>

            <span className="rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-red-600">
              Official Channel
            </span>

          </div>

          <div className="mt-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
              YouTube
            </p>

            <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-navy-800 sm:text-3xl">
              School Moments
            </h3>

            <p className="mt-3 max-w-sm text-sm leading-7 text-slate-500">
              Watch celebrations, cultural programs, school events,
              student performances, and special memories.
            </p>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">

            <span className="break-all text-sm font-semibold text-slate-700">
              @de-paulschoolaska1840
            </span>

            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 transition-all duration-300 group-hover:translate-x-1 group-hover:bg-red-600 group-hover:text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>

          </div>
        </div>
      </a>

      {/* ---------------- FACEBOOK CARD ---------------- */}
      <a
        href="https://www.facebook.com/depaulschoolaska"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Visit De-Paul School Aska Facebook Page"
        className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition-all duration-500 hover:-translate-y-2 hover:border-blue-200 hover:shadow-[0_20px_50px_rgba(37,99,235,0.12)] sm:p-8"
      >
        {/* Top Accent */}
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-blue-700 via-blue-500 to-sky-300" />

        {/* Decorative Circle */}
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-50 transition-transform duration-500 group-hover:scale-150" />

        <div className="relative">

          <div className="flex items-start justify-between">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 transition-all duration-500 group-hover:scale-110 group-hover:bg-blue-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-9 w-9"
                aria-hidden="true"
              >
                <path
                  fill="#1877F2"
                  d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.019 4.388 11.006 10.125 11.927v-8.437H7.078v-3.49h3.047V9.413c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.49 0-1.956.93-1.956 1.884v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.079 24 18.092 24 12.073Z"
                />
              </svg>
            </div>

            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-600">
              Official Page
            </span>

          </div>

          <div className="mt-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Facebook
            </p>

            <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-navy-800 sm:text-3xl">
              Our School Community
            </h3>

            <p className="mt-3 max-w-sm text-sm leading-7 text-slate-500">
              Explore school announcements, achievements, photographs,
              educational activities, and community updates.
            </p>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">

            <span className="text-sm font-semibold text-slate-700">
              De-Paul School Aska
            </span>

            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-all duration-300 group-hover:translate-x-1 group-hover:bg-blue-600 group-hover:text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>

          </div>
        </div>
      </a>

    </div>

    {/* Bottom Note */}
    <p className="mt-8 text-center text-xs font-medium tracking-wide text-slate-400">
      Connecting our school, students, parents, and community.
    </p>

  </div>
</Section>

```tsx
{/* ---------------- EVENTS ---------------- */}
<Section id="events" className="bg-slate-50">
  <SectionHeading
    eyebrow="Happenings"
    title="School Events"
    align="left"
    description="Discover upcoming activities, celebrations, and memorable moments from our school."
  />

  <div className="mt-10">
    <PublicEvents limit={5} />
  </div>

  <div className="mt-10 flex justify-center">
    <Link
      href="/events"
      className="group inline-flex items-center gap-3 rounded-xl bg-navy-800 px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-navy-900 hover:shadow-lg"
    >
      All Events
      <span
        aria-hidden="true"
        className="text-lg transition-transform duration-300 group-hover:translate-x-1"
      >
        →
      </span>
    </Link>
  </div>
</Section>
```
      {/* ---------------- GALLERY ---------------- */}
      <Section id="gallery" className="bg-slate-50">
        <SectionHeading
          eyebrow="Memories"
          title="School Gallery"
          align="left"
          description="Click a gallery folder to view its photos. Use Next and Previous to browse."
        />
        <div className="mt-10">
          <GalleryViewer groups={groups} />
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/gallery"
            className="inline-block rounded-lg border border-navy-800 px-6 py-3 text-sm font-bold uppercase tracking-wider text-navy-800 transition hover:bg-navy-800 hover:text-white"
          >
            Open Full Gallery →
          </Link>
        </div>
      </Section>

      {/* ---------------- ACADEMICS ---------------- */}
      <Section id="academics">
        <SectionHeading
          eyebrow="Academics"
          title="Academic Programmes"
          description="Structured learning pathways from the foundational years to senior secondary education."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {ACADEMICS.map((item) => (
            <InfoCard key={item.title} icon={item.icon} title={item.title}>
              {item.description}
            </InfoCard>
          ))}
        </div>
      </Section>

      {/* ---------------- FACILITIES ---------------- */}
      <Section id="facilities" className="bg-navy-900">
        <SectionHeading eyebrow="Campus" title="School Facilities" tone="dark" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FACILITIES.map((item) => (
            <div
              key={item.title}
              className="rounded-xl bg-navy-800/70 p-6 ring-1 ring-navy-700 transition hover:bg-navy-800"
            >
              <span className="text-3xl" aria-hidden>
                {item.icon}
              </span>
              <h3 className="mt-4 text-lg font-bold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-200">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------------- ACHIEVEMENTS ---------------- */}
      <Section id="achievements">
        <SectionHeading
          eyebrow="Student Life"
          title="Achievements & Activities"
          description="Our students excel in academics, sports, culture and innovation."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ACHIEVEMENTS.map((item) => (
            <InfoCard key={item.title} icon={item.icon} title={item.title}>
              {item.description}
            </InfoCard>
          ))}
        </div>
      </Section>

      {/* ---------------- ADMISSION ---------------- */}
      <Section id="admission" className="bg-gold-50">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <SectionHeading
              eyebrow="Admission"
              title="Admission Information"
              align="left"
              description={settings.admission_intro}
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gold-200 bg-white p-5">
                <p className="text-2xl">📝</p>
                <h3 className="mt-3 text-base font-bold text-navy-800">
                  Application
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {settings.admission_application}
                </p>
              </div>
              <div className="rounded-xl border border-gold-200 bg-white p-5">
                <p className="text-2xl">📅</p>
                <h3 className="mt-3 text-base font-bold text-navy-800">Schedule</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {settings.admission_schedule}
                </p>
              </div>
              <div className="rounded-xl border border-gold-200 bg-white p-5">
                <p className="text-2xl">📄</p>
                <h3 className="mt-3 text-base font-bold text-navy-800">Documents</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {settings.admission_documents}
                </p>
              </div>
              <div className="rounded-xl border border-gold-200 bg-white p-5">
                <p className="text-2xl">📞</p>
                <h3 className="mt-3 text-base font-bold text-navy-800">Enquiry</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {settings.admission_contact}
                </p>
              </div>
            </div>
          </div>
          <div>
            <EnquiryForm />
          </div>
        </div>
      </Section>

      {/* ---------------- AFFILIATION ---------------- */}
      <Section id="affiliation">
        <SectionHeading
          eyebrow="Official Information"
          title="School Affiliation"
          description={`${SCHOOL.name}, Aska is affiliated with the Central Board of Secondary Education.`}
        />
        <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <div className="grid gap-0 md:grid-cols-[1fr_2fr]">
            <div className="flex flex-col items-center justify-center bg-navy-800 p-8 text-center text-white">
              <p className="text-4xl font-extrabold">CBSE</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-gold-300">
                Central Board of Secondary Education
              </p>
              <p className="mt-6 rounded-lg bg-gold-400 px-4 py-2 text-sm font-extrabold text-navy-900">
                Affiliation No. {SCHOOL.affiliation}
              </p>
            </div>
            <dl className="divide-y divide-slate-200 bg-white">
              {[
                { label: "School", value: `${SCHOOL.name}` },
                { label: "Location", value: "Aska, Ganjam, Odisha" },
                { label: "Board", value: "CBSE, New Delhi" },
                { label: "Classes", value: "Pre-Nursery to Class XII" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {row.label}
                  </dt>
                  <dd className="text-sm font-semibold text-navy-800">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/affiliation"
            className="inline-block rounded-lg border border-navy-800 px-6 py-3 text-sm font-bold uppercase tracking-wider text-navy-800 transition hover:bg-navy-800 hover:text-white"
          >
            Full Affiliation Details →
          </Link>
        </div>
      </Section>

      {/* ---------------- CONTACT ---------------- */}
      <Section id="contact" className="bg-navy-900">
        <SectionHeading
          eyebrow="Get in Touch"
          title="Contact Us"
          tone="dark"
          description="We are happy to help parents and students with any query about the school."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { icon: "📍", label: "Address", value: SCHOOL.address },
            { icon: "📞", label: "Phone", value: SCHOOL.phone },
            { icon: "✉️", label: "Email", value: SCHOOL.email },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl bg-navy-800/70 p-6 ring-1 ring-navy-700"
            >
              <span className="text-3xl" aria-hidden>
                {item.icon}
              </span>
              <p className="mt-3 text-xs font-bold uppercase tracking-widest text-gold-300">
                {item.label}
              </p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-white">
                {item.value}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-10 overflow-hidden rounded-2xl bg-white p-3 shadow-xl">
          <div className="relative h-80 w-full overflow-hidden rounded-xl">
            <iframe
              title="School location map"
              src={MAPS_EMBED}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-bold text-navy-800">
                📍 {SCHOOL.name}, Aska
              </p>
              <p className="text-xs text-slate-500">{SCHOOL.address}</p>
            </div>
            <a
              href={MAPS_LINK}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-navy-800 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-navy-700"
            >
              📍 Open in Google Maps
            </a>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
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
            className="rounded-full bg-white/10 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white ring-1 ring-white/30 transition hover:bg-white/20"
          >
            ▤ School Magazine
          </a>
          <Link
            href="/about"
            className="rounded-full bg-white/10 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white ring-1 ring-white/30 transition hover:bg-white/20"
          >
            About the School
          </Link>
        </div>
      </Section>
    </>
  );
}
