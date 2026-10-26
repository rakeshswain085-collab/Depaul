import Link from "next/link";
import { Crest } from "@/components/crest";
import { MAPS_LINK, NAV_LINKS, SCHOOL, UTILITY_LINKS } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="bg-navy-900 text-navy-100">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <Crest className="h-14 w-14" />
            <div>
              <p className="text-base font-extrabold uppercase tracking-wide text-white">
                {SCHOOL.name}, Aska
              </p>
              <p className="text-xs text-gold-300">{SCHOOL.tagline}</p>
            </div>
          </div>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-navy-200">
            A welcoming educational environment at Aska, Ganjam where students are
            encouraged to learn, participate, develop confidence and grow with
            values under the CBSE curriculum.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={SCHOOL.youtube}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-navy-800 px-4 py-2 text-xs font-semibold text-gold-300 ring-1 ring-navy-700 transition hover:bg-navy-700"
            >
              ▶ YouTube Channel
            </a>
            <a
              href={SCHOOL.magazine}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-navy-800 px-4 py-2 text-xs font-semibold text-gold-300 ring-1 ring-navy-700 transition hover:bg-navy-700"
            >
              ▤ School Magazine
            </a>
            <a
              href={MAPS_LINK}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-gold-400 px-4 py-2 text-xs font-semibold text-navy-900 transition hover:bg-gold-300"
            >
              📍 Google Maps
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-gold-300">
            Quick Links
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-navy-200 transition hover:text-gold-300"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-gold-300">
            Official
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {UTILITY_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-navy-200 transition hover:text-gold-300"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <h3 className="mt-7 text-sm font-bold uppercase tracking-widest text-gold-300">
            Contact
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-navy-200">
            <li>{SCHOOL.address}</li>
            <li>
              <a href={`tel:${SCHOOL.phoneHref}`} className="hover:text-gold-300">
                {SCHOOL.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${SCHOOL.email}`} className="hover:text-gold-300">
                {SCHOOL.email}
              </a>
            </li>
            <li>CBSE Affiliation No.: {SCHOOL.affiliation}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-navy-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-navy-300 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {SCHOOL.name}. All Rights Reserved.
          </p>
          <p className="text-navy-400">
            Rankanath Vihar, College Square, Nuagam, Aska, Ganjam, Odisha – 761111
          </p>
        </div>
      </div>
    </footer>
  );
}
