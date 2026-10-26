
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Crest } from "@/components/crest";
import { NAV_LINKS, SCHOOL, UTILITY_LINKS } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  /* Reset the scroll position after route navigation. */
  useEffect(() => {
    // Preserve fragment navigation, such as the Messages link on the home page.
    if (!window.location.hash) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });
    }
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 w-full shadow-lg shadow-navy-900/10">
      {/* =========================================
          UTILITY STRIP
      ========================================= */}
      <div className="w-full bg-navy-900 text-navy-100">
        <div className="mx-auto flex min-h-9 w-full max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2 sm:px-4 lg:px-6">
          {/* Left: School contact information */}
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:gap-4 sm:text-xs">
            <span className="font-semibold text-gold-300">
              CBSE Affiliation No.: {SCHOOL.affiliation}
            </span>

            <a
              href={`tel:${SCHOOL.phoneHref}`}
              className="transition-colors hover:text-gold-300"
            >
              <span className="mr-1 text-pink-400" aria-hidden="true">
                ☎
              </span>
              {SCHOOL.phone}
            </a>

            <a
              href={`mailto:${SCHOOL.email}`}
              className="hidden transition-colors hover:text-gold-300 lg:inline"
            >
              <span aria-hidden="true">✉</span>{" "}
              {SCHOOL.email}
            </a>
          </div>

          {/* Right: External links */}
          <div className="flex shrink-0 items-center gap-3 whitespace-nowrap text-[10px] sm:gap-4 sm:text-xs">
            <a
              href={SCHOOL.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-gold-300"
            >
              <span
                className="mr-1 text-red-400"
                aria-hidden="true"
              >
                ▶
              </span>
              YouTube
            </a>

            <a
              href={SCHOOL.magazine}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-gold-300"
            >
              <span className="mr-1" aria-hidden="true">
                ▣
              </span>
              Magazine
            </a>
          </div>
        </div>
      </div>

      {/* =========================================
          MAIN SCHOOL BRANDING
      ========================================= */}
      <div className="bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:gap-4 sm:py-2.5">
          {/* School logo and name */}
          <Link
            href="/"
            aria-label="De-Paul Senior Secondary School home"
            className="flex min-w-0 items-center gap-3 sm:gap-4"
          >
            <Crest className="h-12 w-12 shrink-0 object-contain sm:h-16 sm:w-16 lg:h-20 lg:w-20" />

            <span className="min-w-0 leading-tight">
              <span className="block text-sm font-extrabold uppercase tracking-wide text-navy-800 sm:text-xl md:text-2xl lg:text-3xl">
                De-Paul Senior Secondary School
              </span>

              <span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.12em] text-gold-600 sm:text-xs md:text-sm">
                Aska &middot; Ganjam &middot; Odisha
              </span>
            </span>
          </Link>

          {/* Mobile navigation toggle */}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg border border-navy-200 text-navy-800 transition-colors hover:bg-navy-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 lg:hidden"
          >
            <span
              className={`block h-0.5 w-5 bg-current transition-transform duration-200 ${
                open ? "translate-y-1 rotate-45" : ""
              }`}
            />

            <span
              className={`mt-1 h-0.5 w-5 bg-current transition-opacity duration-200 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />

            <span
              className={`mt-1 h-0.5 w-5 bg-current transition-transform duration-200 ${
                open ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* =========================================
          DESKTOP NAVIGATION
      ========================================= */}
      <nav
        aria-label="Main navigation"
        className="bg-navy-800 text-white"
      >
        <ul className="mx-auto hidden max-w-7xl flex-wrap items-center gap-1 px-4 py-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const basePath = link.href.split("#")[0];

            const active =
              link.href === "/"
                ? pathname === "/"
                : basePath !== "/" &&
                  (pathname === basePath ||
                    pathname.startsWith(`${basePath}/`));

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`block rounded-sm px-3 py-3 text-sm font-semibold transition-colors xl:px-4 xl:text-base ${
                    active
                      ? "bg-gold-400 text-navy-900"
                      : "text-navy-50 hover:bg-navy-700 hover:text-gold-300"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}

          {/* Additional navigation links */}
          <li className="ml-auto flex shrink-0 items-center gap-1">
            {UTILITY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block whitespace-nowrap px-3 py-3 text-sm font-semibold text-navy-200 transition-colors hover:text-gold-300"
              >
                {link.label}
              </Link>
            ))}
          </li>
        </ul>

        {/* =========================================
            MOBILE NAVIGATION
        ========================================= */}
        <div
          id="mobile-navigation"
          className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ease-in-out lg:hidden ${
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
          aria-hidden={!open}
        >
          <div className="min-h-0 overflow-hidden">
            <ul className="flex flex-col px-4 pb-3 pt-1">
              {NAV_LINKS.map((link) => {
                const basePath = link.href.split("#")[0];

                const active =
                  link.href === "/"
                    ? pathname === "/"
                    : basePath !== "/" &&
                      (pathname === basePath ||
                        pathname.startsWith(`${basePath}/`));

                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      tabIndex={open ? 0 : -1}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={`block border-b border-navy-700/60 py-3 text-sm font-semibold transition-colors ${
                        active
                          ? "text-gold-300"
                          : "text-navy-50 hover:text-gold-300"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}

              <li className="flex flex-wrap gap-2 pt-3">
                {UTILITY_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    tabIndex={open ? 0 : -1}
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-navy-700 px-3 py-2 text-xs font-semibold text-gold-300 transition-colors hover:bg-navy-600"
                  >
                    {link.label}
                  </Link>
                ))}
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}
