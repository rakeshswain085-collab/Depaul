"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Crest } from "@/components/crest";
import { NAV_LINKS, SCHOOL, UTILITY_LINKS } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 shadow-lg shadow-navy-900/10">
      {/* Utility strip */}
      <div className="bg-navy-900 text-[11px] text-navy-100 sm:text-xs">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-1.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-semibold text-gold-300">
              CBSE Affiliation No.: {SCHOOL.affiliation}
            </span>
            <a
              href={`tel:${SCHOOL.phoneHref}`}
              className="transition hover:text-gold-300"
            >
              📞 {SCHOOL.phone}
            </a>
            <a
              href={`mailto:${SCHOOL.email}`}
              className="hidden transition hover:text-gold-300 md:inline"
            >
              ✉ {SCHOOL.email}
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <a
              href={SCHOOL.youtube}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-gold-300"
            >
              ▶ YouTube
            </a>
            <a
              href={SCHOOL.magazine}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-gold-300"
            >
              📖 Magazine
            </a>
          </div>
        </div>
      </div>


{/* Main bar */}
<div className="bg-white">
  <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:gap-4 sm:py-2.5">

    {/* School Logo and Name */}
    <Link
      href="/"
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

    {/* Mobile Navigation Button */}
    <button
      type="button"
      onClick={() => setOpen((value) => !value)}
      aria-label="Toggle navigation menu"
      aria-expanded={open}
      className="shrink-0 rounded-md border border-navy-200 px-3 py-2 text-navy-800 transition hover:bg-navy-50 lg:hidden"
    >
      <span className="block h-0.5 w-6 bg-current" />
      <span className="mt-1.5 block h-0.5 w-6 bg-current" />
      <span className="mt-1.5 block h-0.5 w-6 bg-current" />
    </button>

  </div>
</div>
     
{/* Nav */}
<nav className="bg-navy-800 text-white">
  <ul className="mx-auto hidden max-w-7xl flex-wrap items-center gap-1 px-4 py-1 lg:flex">

    {NAV_LINKS.map((link) => {
      const active =
        link.href === "/"
          ? pathname === "/"
          : pathname.startsWith(link.href.split("#")[0]) &&
            link.href.split("#")[0] !== "/";

      return (
        <li key={link.href}>
          <Link
            href={link.href}
            className={`block px-4 py-3 text-base font-semibold transition lg:px-4 lg:py-3.5 lg:text-lg ${
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

    {/* Utility Links */}
    <li className="ml-auto flex items-center gap-1">
      {UTILITY_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="block px-3 py-3 text-sm font-semibold text-navy-200 transition hover:text-gold-300"
        >
          {link.label}
        </Link>
      ))}
    </li>

  </ul>

  {/* Mobile Navigation */}
  {open ? (
    <ul className="flex flex-col px-4 pb-3 pt-1 lg:hidden">
      {NAV_LINKS.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className="block border-b border-navy-700/60 py-3 text-base font-semibold text-navy-50"
          >
            {link.label}
          </Link>
        </li>
      ))}

      <li className="flex flex-wrap gap-3 pt-3">
        {UTILITY_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full bg-navy-700 px-3 py-1.5 text-xs font-semibold text-gold-300"
          >
            {link.label}
          </Link>
        ))}
      </li>
    </ul>
  ) : null}
</nav>
    </header>
  );
}
