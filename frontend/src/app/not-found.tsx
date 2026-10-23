import Link from "next/link";
import { Crest } from "@/components/crest";
import { SCHOOL } from "@/lib/site";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy-900 px-4 text-center text-white">
      <Crest className="h-20 w-20" />
      <p className="mt-8 text-6xl font-extrabold text-gold-300">404</p>
      <h1 className="mt-3 text-2xl font-extrabold uppercase tracking-tight">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-navy-200">
        The page you are looking for is not available on the website of{" "}
        {SCHOOL.name}, Aska. Please use the links below to continue.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-gold-400 px-6 py-3 text-sm font-bold uppercase tracking-wider text-navy-900 transition hover:bg-gold-300"
        >
          Back to Home
        </Link>
        <Link
          href="/notices"
          className="rounded-lg bg-white/10 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white ring-1 ring-white/30 transition hover:bg-white/20"
        >
          School Notices
        </Link>
        <Link
          href="/contact"
          className="rounded-lg bg-white/10 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white ring-1 ring-white/30 transition hover:bg-white/20"
        >
          Contact Us
        </Link>
      </div>
    </div>
  );
}
