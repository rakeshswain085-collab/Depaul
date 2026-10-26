import Link from "next/link";
import { SiteImage } from "@/components/site-image-provider";
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
  getMessage,
  getSettings,
  groupPhotos,
} from "@/lib/queries";
import { getGalleryPhotos } from "@/lib/gallery";
import {
  ACADEMICS,
  ACHIEVEMENTS,
  FACILITIES,
  MAPS_EMBED,
  MAPS_LINK,
  SCHOOL,
} from "@/lib/site";

export const dynamic = "force-dynamic";

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
        <SiteImage
          slot="homeHero"
          alt="De-Paul Senior Secondary School campus"
          fill
          priority
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
    
<div className="mt-6 grid grid-cols-2 gap-2.5 sm:mt-8 sm:gap-3 lg:flex lg:flex-wrap lg:gap-3">
  <Link
    href="#events"
    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gold-400 px-3 py-3 text-center text-xs font-bold uppercase leading-tight tracking-wide text-navy-900 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-300 hover:shadow-md sm:px-5 sm:text-sm lg:px-6"
  >
    View School Events
  </Link>

  <Link
    href="#latest-notice"
    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white/10 px-3 py-3 text-center text-xs font-bold uppercase leading-tight tracking-wide text-white ring-1 ring-white/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20 sm:px-5 sm:text-sm lg:px-6"
  >
    Latest Notice
  </Link>

  <Link
    href="/admission"
    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white/10 px-3 py-3 text-center text-xs font-bold uppercase leading-tight tracking-wide text-white ring-1 ring-white/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20 sm:px-5 sm:text-sm lg:px-6"
  >
    Admission
  </Link>

  <Link
    href="/admin/login"
    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gold-400 px-3 py-3 text-center text-xs font-bold uppercase leading-tight tracking-wide text-navy-900 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-300 hover:shadow-md sm:px-5 sm:text-sm lg:px-6"
  >
    Admin Login
  </Link>
</div>

  
<dl className="mt-6 grid w-full max-w-xl grid-cols-3 gap-2 border-t border-white/15 pt-4 text-white sm:mt-10 sm:gap-4 sm:pt-6">
  {[
    { value: "26+", label: "Years of Excellence" },
    { value: "600+", label: "Students" },
    { value: "Pre-Nur–XII", label: "Classes Offered" },
  ].map((stat) => (
    <div key={stat.label} className="min-w-0">
      <dt className="whitespace-nowrap text-base font-extrabold leading-tight text-gold-300 sm:text-2xl lg:text-3xl">
        {stat.value}
      </dt>

      <dd className="mt-1 text-[8px] font-semibold uppercase leading-tight tracking-normal text-navy-200 sm:text-[11px] sm:tracking-wider">
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
      <SiteImage
        slot="schoolLogo"
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
  <div className="grid gap-6 lg:grid-cols-2 lg:items-center lg:gap-12">

    {/* TEXT AND SCHOOL INFORMATION — FIRST */}
    <div className="order-1 min-w-0">

      <SectionHeading
        eyebrow="About the School"
        title="Welcome to our school"
        align="left"
        description="De-Paul Senior Secondary School, Aska — we provide a welcoming educational environment where students are encouraged to learn, participate, develop confidence and grow with values."
      />

      {/* COMPACT SCHOOL INFORMATION */}
      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-3">

        {/* Location */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-amber-300 sm:p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-base">
              📍
            </span>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 sm:text-xs">
              Location
            </p>
          </div>

          <p className="mt-2 text-sm font-semibold leading-5 text-navy-800 sm:text-base">
            Aska, Ganjam, Odisha
          </p>
        </div>

        {/* Board */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-amber-300 sm:p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-base">
              🎓
            </span>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 sm:text-xs">
              Board
            </p>
          </div>

          <p className="mt-2 text-sm font-semibold leading-5 text-navy-800 sm:text-base">
            Central Board of Secondary Education
          </p>
        </div>

        {/* Affiliation */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-amber-300 sm:p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-base">
              🏷️
            </span>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 sm:text-xs">
              Affiliation No.
            </p>
          </div>

          <p className="mt-2 text-sm font-semibold leading-5 text-navy-800 sm:text-base">
            {SCHOOL.affiliation}
          </p>
        </div>

        {/* Classes */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-amber-300 sm:p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-base">
              🏛️
            </span>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 sm:text-xs">
              Classes
            </p>
          </div>

          <p className="mt-2 text-sm font-semibold leading-5 text-navy-800 sm:text-base">
            Pre-Nursery to Class XII
          </p>
        </div>

      </div>

      {/* MORE ABOUT BUTTON */}
      <Link
        href="/about"
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-navy-800 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all duration-300 hover:bg-navy-700 sm:mt-6 sm:px-6 sm:text-sm"
      >
        More About Us

        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
          aria-hidden="true"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>

    </div>

    {/* CAMPUS IMAGE — AFTER TEXT ON MOBILE */}
    <div className="relative order-2 min-w-0 pb-5 lg:pb-0">

      <div className="relative h-52 overflow-hidden rounded-2xl shadow-lg sm:h-72 lg:h-[420px]">
        <SiteImage
          slot="homeCampus"
          alt="De-Paul School campus"
          fill
          className="object-cover transition-transform duration-700 hover:scale-[1.02]"
        />
      </div>

      {/* ESTABLISHED BADGE */}
      <div className="absolute -bottom-1 left-4 rounded-xl bg-gold-400 px-4 py-2.5 shadow-lg sm:left-6 sm:px-5 sm:py-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-navy-900 sm:text-xs">
          Established
        </p>

        <p className="text-xl font-extrabold text-navy-900 sm:text-2xl">
          {SCHOOL.established}
        </p>
      </div>

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
        { message: chairman, imageSlot: "chairman" as const },
        { message: principal, imageSlot: "principal" as const },
      ].map(({ message, imageSlot }) =>
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
                  <SiteImage
                    slot={imageSlot}
                    alt={message.name}
                    fill
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

   {/* ---------------- SOCIAL MEDIA SECTION ---------------- */}
<div className="grid grid-cols-2 items-stretch gap-3 sm:gap-5 lg:gap-6">

  {/* ---------------- YOUTUBE CARD ---------------- */}
  <a
    href={SCHOOL.youtube}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Visit De-Paul School Aska YouTube Channel"
    className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-red-100 bg-white p-3 shadow-[0_5px_20px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-[0_12px_30px_rgba(239,68,68,0.10)] sm:rounded-3xl sm:p-6 lg:p-8"
  >
    <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-red-500 via-red-400 to-orange-300" />

    <div className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-red-50 transition-transform duration-500 group-hover:scale-125 sm:-right-12 sm:-top-12 sm:h-40 sm:w-40" />

    <div className="relative flex h-full flex-col">
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 transition-all duration-300 group-hover:bg-red-100 sm:h-14 sm:w-14 sm:rounded-2xl lg:h-16 lg:w-16">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="h-6 w-6 sm:h-8 sm:w-8 lg:h-9 lg:w-9"
            aria-hidden="true"
          >
            <path
              fill="#FF0033"
              d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8Z"
            />
            <path fill="#FFFFFF" d="m9.6 15.6 6.2-3.6-6.2-3.6v7.2Z" />
          </svg>
        </div>

        <span className="rounded-full border border-red-100 bg-red-50 px-1.5 py-1 text-[7px] font-bold uppercase leading-tight tracking-wide text-red-600 sm:px-2.5 sm:text-[9px] lg:px-3 lg:py-1.5 lg:text-[10px]">
          Official Channel
        </span>
      </div>

      <div className="mt-4 sm:mt-6 lg:mt-7">
        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-red-600 sm:text-[11px] sm:tracking-[0.2em] lg:text-xs">
          YouTube
        </p>

        <h3 className="mt-1.5 text-base font-extrabold leading-tight tracking-tight text-navy-800 sm:text-xl lg:text-3xl">
          School Moments
        </h3>

        <p className="mt-2 text-[11px] leading-5 text-slate-500 sm:mt-3 sm:text-sm sm:leading-6 lg:max-w-sm lg:text-base lg:leading-7">
          Watch celebrations, cultural programs, school events, student
          performances, and special memories.
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-1.5 border-t border-slate-100 pt-3 mt-4 sm:mt-6 sm:pt-4 lg:mt-8 lg:pt-5">
        <span className="min-w-0 break-all text-[9px] font-semibold leading-4 text-slate-700 sm:text-xs lg:text-sm">
          @de-paulschoolaska1840
        </span>

        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 transition-all duration-300 group-hover:bg-red-600 group-hover:text-white sm:h-9 sm:w-9 lg:h-10 lg:w-10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4 sm:h-5 sm:w-5"
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
    className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white p-3 shadow-[0_5px_20px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_12px_30px_rgba(37,99,235,0.10)] sm:rounded-3xl sm:p-6 lg:p-8"
  >
    <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-blue-700 via-blue-500 to-sky-300" />

    <div className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-blue-50 transition-transform duration-500 group-hover:scale-125 sm:-right-12 sm:-top-12 sm:h-40 sm:w-40" />

    <div className="relative flex h-full flex-col">
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 transition-all duration-300 group-hover:bg-blue-100 sm:h-14 sm:w-14 sm:rounded-2xl lg:h-16 lg:w-16">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="h-6 w-6 sm:h-8 sm:w-8 lg:h-9 lg:w-9"
            aria-hidden="true"
          >
            <path
              fill="#1877F2"
              d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.019 4.388 11.006 10.125 11.927v-8.437H7.078v-3.49h3.047V9.413c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.49 0-1.956.93-1.956 1.884v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.079 24 18.092 24 12.073Z"
            />
          </svg>
        </div>

        <span className="rounded-full border border-blue-100 bg-blue-50 px-1.5 py-1 text-[7px] font-bold uppercase leading-tight tracking-wide text-blue-600 sm:px-2.5 sm:text-[9px] lg:px-3 lg:py-1.5 lg:text-[10px]">
          Official Page
        </span>
      </div>

      <div className="mt-4 sm:mt-6 lg:mt-7">
        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-blue-600 sm:text-[11px] sm:tracking-[0.2em] lg:text-xs">
          Facebook
        </p>

        <h3 className="mt-1.5 text-base font-extrabold leading-tight tracking-tight text-navy-800 sm:text-xl lg:text-3xl">
          Our School Community
        </h3>

        <p className="mt-2 text-[11px] leading-5 text-slate-500 sm:mt-3 sm:text-sm sm:leading-6 lg:max-w-sm lg:text-base lg:leading-7">
          Explore school announcements, achievements, photographs,
          educational activities, and community updates.
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-1.5 border-t border-slate-100 pt-3 mt-4 sm:mt-6 sm:pt-4 lg:mt-8 lg:pt-5">
        <span className="min-w-0 text-[9px] font-semibold leading-4 text-slate-700 sm:text-xs lg:text-sm">
          De-Paul School Aska
        </span>

        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white sm:h-9 sm:w-9 lg:h-10 lg:w-10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4 sm:h-5 sm:w-5"
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
<Section id="academics" className="py-6 sm:py-10 lg:py-14">
  <SectionHeading
    eyebrow="Academics"
    title="Academic Programmes"
    description="Structured learning pathways from the foundational years to senior secondary education."
  />

  <div className="mt-6 grid grid-cols-2 items-stretch gap-2.5 sm:mt-8 sm:gap-4 lg:mt-10 lg:grid-cols-3 lg:gap-5">
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

  {/* View All Academic Programmes */}
  <div className="mt-5 flex justify-center sm:mt-7">
    <Link
      href="/academics"
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-navy-800 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-navy-800 transition-all duration-300 hover:bg-navy-800 hover:text-white sm:px-5 sm:text-xs"
    >
      Explore Academics
      <span aria-hidden="true" className="text-base">
        →
      </span>
    </Link>
  </div>
</Section>

{/* ---------------- SCHOOL FACILITIES ---------------- */}
<Section
  id="facilities"
  className="bg-navy-900 py-7 sm:py-10 lg:py-12"
>
  <SectionHeading
    eyebrow="Campus"
    title="School Facilities"
    tone="dark"
  />

  <div className="mt-5 grid grid-cols-2 items-stretch gap-2.5 sm:mt-7 sm:gap-4 lg:mt-8 lg:grid-cols-3 lg:gap-5">
    {FACILITIES.map((item) => (
      <article
        key={item.title}
        className="group min-w-0 rounded-xl bg-navy-800/70 p-3 ring-1 ring-navy-700 transition-all duration-300 hover:bg-navy-800 hover:ring-gold-400/60 sm:rounded-2xl sm:p-4 lg:p-5"
      >
        {/* Icon */}
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-lg sm:h-10 sm:w-10 sm:text-xl">
          {item.icon}
        </div>

        {/* Title */}
        <h3 className="mt-3 text-sm font-bold leading-5 text-white sm:mt-3.5 sm:text-base sm:leading-6 lg:text-lg">
          {item.title}
        </h3>

        {/* Description */}
        <p className="mt-1.5 text-xs leading-5 text-navy-200 sm:mt-2 sm:text-sm sm:leading-6">
          {item.description}
        </p>
      </article>
    ))}
  </div>
</Section>

   
{/* ---------------- ACHIEVEMENTS ---------------- */}
<Section id="achievements" className="py-6 sm:py-9 lg:py-12">
  <SectionHeading
    eyebrow="Student Life"
    title="Achievements & Activities"
    description="Our students excel in academics, sports, culture and innovation."
  />

  <div className="mt-5 grid grid-cols-2 items-stretch gap-2.5 sm:mt-7 sm:gap-4 lg:mt-9 lg:grid-cols-4 lg:gap-5">
    {ACHIEVEMENTS.map((item) => (
      <div
        key={item.title}
        className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300 hover:border-amber-300 hover:shadow-md sm:rounded-2xl sm:p-4 lg:p-5"
      >
        <InfoCard
          icon={item.icon}
          title={item.title}
        >
          {item.description}
        </InfoCard>
      </div>
    ))}
  </div>
</Section>


{/* ---------------- ADMISSION ---------------- */}
<Section id="admission" className="bg-gold-50">
  <div className="mx-auto w-full max-w-7xl">
    <div className="grid grid-cols-1 items-start gap-5 sm:gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 xl:gap-10">
      {/* LEFT: Admission Information */}
      <div className="min-w-0">
        <SectionHeading
          eyebrow="Admission"
          title="Admission Information"
          align="left"
          description={settings.admission_intro}
        />

        {/* Information Cards */}
        <div className="mt-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:mt-5 sm:gap-4">
          {/* Application */}
          <article className="rounded-xl border border-gold-200 bg-white p-3.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-gold-400 hover:shadow-md sm:p-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-50 text-lg">
                📝
              </span>
              <h3 className="text-sm font-bold text-navy-800 sm:text-base">
                Application
              </h3>
            </div>
            <p className="mt-2 break-words text-xs leading-5 text-slate-600 sm:text-[13px] sm:leading-relaxed">
              {settings.admission_application}
            </p>
          </article>

          {/* Schedule */}
          <article className="rounded-xl border border-gold-200 bg-white p-3.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-gold-400 hover:shadow-md sm:p-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-50 text-lg">
                📅
              </span>
              <h3 className="text-sm font-bold text-navy-800 sm:text-base">
                Schedule
              </h3>
            </div>
            <p className="mt-2 break-words text-xs leading-5 text-slate-600 sm:text-[13px] sm:leading-relaxed">
              {settings.admission_schedule}
            </p>
          </article>

          {/* Documents */}
          <article className="rounded-xl border border-gold-200 bg-white p-3.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-gold-400 hover:shadow-md sm:p-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-50 text-lg">
                📄
              </span>
              <h3 className="text-sm font-bold text-navy-800 sm:text-base">
                Documents
              </h3>
            </div>
            <p className="mt-2 break-words text-xs leading-5 text-slate-600 sm:text-[13px] sm:leading-relaxed">
              {settings.admission_documents}
            </p>
          </article>

          {/* Enquiry */}
          <article className="rounded-xl border border-gold-200 bg-white p-3.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-gold-400 hover:shadow-md sm:p-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-50 text-lg">
                📞
              </span>
              <h3 className="text-sm font-bold text-navy-800 sm:text-base">
                Enquiry
              </h3>
            </div>
            <p className="mt-2 break-words text-xs leading-5 text-slate-600 sm:text-[13px] sm:leading-relaxed">
              {settings.admission_contact}
            </p>
          </article>
        </div>
      </div>

      {/* RIGHT: Admission Enquiry Form */}
      <div className="min-w-0 rounded-xl border border-gold-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4 lg:p-4 xl:p-5">
        <EnquiryForm />
      </div>
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