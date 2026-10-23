import type { ReactNode } from "react";
import { formatLongDate, formatShortDate } from "@/lib/queries";
import type { Notice, SchoolEvent } from "@/lib/queries";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  tone = "light",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  tone?: "light" | "dark";
}) {
  const alignment = align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <div className={`max-w-3xl ${alignment}`}>
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold-600">
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={`mt-2 text-2xl font-extrabold uppercase tracking-tight sm:text-3xl ${
          tone === "dark" ? "text-white" : "text-navy-800"
        }`}
      >
        {title}
      </h2>
      <div
        className={`mt-3 h-1 w-20 rounded-full bg-gold-400 ${
          align === "center" ? "mx-auto" : ""
        }`}
      />
      {description ? (
        <p
          className={`mt-4 text-sm leading-relaxed sm:text-base ${
            tone === "dark" ? "text-navy-200" : "text-slate-600"
          }`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`px-4 py-16 sm:py-20 ${className}`}>
      <div className="mx-auto max-w-7xl">{children}</div>
    </section>
  );
}

export function InfoCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="group h-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-gold-300 hover:shadow-xl">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy-50 text-2xl transition group-hover:bg-gold-100">
        <span aria-hidden>{icon}</span>
      </div>
      <h3 className="mt-4 text-lg font-bold text-navy-800">{title}</h3>
      <div className="mt-2 text-sm leading-relaxed text-slate-600">{children}</div>
    </div>
  );
}

export function NoticeCard({ notice }: { notice: Notice }) {
  const date = new Date(`${notice.noticeDate}T00:00:00`);
  return (
    <article className="flex h-full gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-gold-300 hover:shadow-lg">
      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-navy-800 text-white">
        <span className="text-2xl font-extrabold leading-none">
          {String(date.getDate()).padStart(2, "0")}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gold-300">
          {date.toLocaleDateString("en-IN", { month: "short" })}
        </span>
      </div>
      <div className="min-w-0">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            notice.isPinned
              ? "bg-gold-100 text-gold-700"
              : "bg-navy-50 text-navy-600"
          }`}
        >
          {notice.category}
        </span>
        <h3 className="mt-2 text-base font-bold text-navy-800">{notice.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          {notice.body}
        </p>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {formatLongDate(notice.noticeDate)}
        </p>
      </div>
    </article>
  );
}

export function EventCard({ event }: { event: SchoolEvent }) {
  const upcoming = event.status.toLowerCase() === "upcoming";
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-center justify-between bg-navy-800 px-5 py-3 text-white">
        <span className="text-sm font-bold uppercase tracking-wider text-gold-300">
          🎓 {event.status}
        </span>
        <span className="text-xs font-semibold text-navy-100">
          {formatShortDate(event.eventDate)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold text-navy-800">{event.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
          {event.description}
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500">
          <span>📍 {event.venue}</span>
          <span
            className={`rounded-full px-2.5 py-1 ${
              upcoming ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            {formatLongDate(event.eventDate)}
          </span>
        </div>
      </div>
    </article>
  );
}

export function FeatureRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4">
      <span className="text-xl" aria-hidden>
        {icon}
      </span>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="text-sm font-semibold text-navy-800">{value}</p>
      </div>
    </div>
  );
}

export function PageHero({
  title,
  subtitle,
  breadcrumb,
}: {
  title: string;
  subtitle?: string;
  breadcrumb: string;
}) {
  return (
    <div className="bg-navy-800 px-4 py-14 text-white">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold-300">
          Home / {breadcrumb}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
          {title}
        </h1>
        <div className="mt-4 h-1 w-24 rounded-full bg-gold-400" />
        {subtitle ? (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-navy-200 sm:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
