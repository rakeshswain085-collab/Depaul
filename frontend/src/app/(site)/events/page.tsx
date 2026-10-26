
import Link from "next/link";
import { PublicEvents } from "@/components/public-events";

export const dynamic = "force-dynamic";

export default function EventsPage() {
  return (
    <main className="min-h-screen bg-[#f5f8fc]">
      {/* =========================================
          HERO SECTION — MATCHES GALLERY & NOTICE
      ========================================== */}
      <section className="relative isolate overflow-hidden bg-[#10264b] text-white">
        {/* Subtle background decoration */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-amber-400/5 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-[72px]">
          <div className="max-w-3xl animate-fade-up">
            {/* Breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              className="mb-5 text-xs font-extrabold uppercase tracking-[0.22em] text-amber-400 sm:text-sm"
            >
              <Link
                href="/"
                className="transition-colors hover:text-white"
              >
                Home
              </Link>

              <span className="mx-2 text-amber-400/60">/</span>

              <span aria-current="page">Events</span>
            </nav>

            {/* Eyebrow */}
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-amber-400 sm:text-sm">
              Happenings at De-Paul
            </p>

            {/* Main heading */}
            <h1 className="mt-3 text-3xl font-extrabold uppercase leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
              School Events
            </h1>

            {/* Yellow underline */}
            <div
              aria-hidden="true"
              className="mt-5 h-1 w-20 rounded-full bg-amber-400 transition-all duration-500 hover:w-28"
            />

            {/* Description */}
            <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-100/90 sm:text-base sm:leading-8">
              Discover upcoming activities, celebrations, academic
              programmes and memorable moments from our school
              community.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================
          EVENTS CONTENT SECTION
      ========================================== */}
      <section className="bg-[#f5f8fc]">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
          {/* Section heading */}
          <div className="mb-7 animate-fade-up sm:mb-9">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-blue-800 sm:text-sm">
              Explore Our Activities
            </p>

            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#10264b] sm:text-3xl">
              Life at De-Paul
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Explore school celebrations, academic programmes,
              competitions and activities that bring our community
              together.
            </p>
          </div>

          {/* Existing events component */}
          <div className="min-w-0">
            <PublicEvents />
          </div>
        </div>
      </section>
    </main>
  );
}
