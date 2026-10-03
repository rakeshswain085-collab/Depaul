import type { Metadata } from "next";
import Link from "next/link";
import { NoticeCard, PageHero, Section } from "@/components/ui";
import { getNotices } from "@/lib/queries";

export const metadata: Metadata = {
  title: "School Notices",
  description:
    "Notice board of De-Paul Senior Secondary School, Aska – latest announcements, examination notices and circulars.",
};

export default function NoticesPage() {
  const notices = getNotices();

  return (
    <>
      <PageHero
        breadcrumb="Notice"
        title="School Notice Board"
        subtitle="All official announcements of the school are published here. The most recent notice appears first."
      />

      <Section className="bg-slate-50">
        {notices.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            No notices have been published yet.
          </p>
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-2">
              {notices.map((notice) => (
                <NoticeCard key={notice.id} notice={notice} />
              ))}
            </div>
            <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold text-navy-800">
                Archives in brief
              </h2>
              <ul className="mt-4 divide-y divide-slate-100">
                {notices.map((notice) => (
                  <li
                    key={notice.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                  >
                    <span className="font-semibold text-navy-800">
                      {notice.title}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {notice.category} &middot; {notice.noticeDate}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/events"
            className="rounded-lg bg-navy-800 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-navy-700"
          >
            View School Events
          </Link>
          <Link
            href="/contact"
            className="rounded-lg border border-navy-800 px-6 py-3 text-sm font-bold uppercase tracking-wider text-navy-800 transition hover:bg-navy-800 hover:text-white"
          >
            Contact the Office
          </Link>
        </div>
      </Section>
    </>
  );
}
