import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section } from "@/components/ui";
import { getBookList } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Book List 2026-27",
  description:
    "Prescribed book list for the 2026-27 academic session at De-Paul Senior Secondary School, Aska.",
};

export default function BookListPage() {
  const books = getBookList();
  const classes = [...new Set(books.map((book) => book.className))];

  return (
    <>
      <PageHero
        breadcrumb="Book List 2026-27"
        title="Book List 2026-27"
        subtitle="Prescribed textbooks for the coming academic session. Parents are requested to purchase books only from approved sources."
      />

      <Section>
        {books.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
            The book list is being updated. Please contact the school office.
          </p>
        ) : (
          <div className="space-y-8">
            {classes.map((className) => (
              <div
                key={className}
                className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm"
              >
                <div className="flex items-center justify-between bg-navy-800 px-6 py-4">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-gold-300">
                    📚 {className}
                  </h2>
                  <span className="text-xs font-semibold text-navy-200">
                    Session 2026-27
                  </span>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Subject
                      </th>
                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Book title
                      </th>
                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Publisher
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {books
                      .filter((book) => book.className === className)
                      .map((book) => (
                        <tr key={book.id}>
                          <td className="px-5 py-3.5 font-semibold text-gold-700">
                            {book.subject}
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-navy-800">
                            {book.title}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600">
                            {book.publisher}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 rounded-2xl bg-gold-50 p-7">
          <p className="text-sm leading-relaxed text-navy-800">
            Note: The above list is indicative. Please confirm the final list with
            the class teacher before purchasing books for the new session.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="rounded-lg bg-navy-800 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-navy-700"
            >
              Contact the Office
            </Link>
            <Link
              href="/notices"
              className="rounded-lg border border-navy-800 px-6 py-3 text-sm font-bold uppercase tracking-wider text-navy-800 transition hover:bg-navy-800 hover:text-white"
            >
              School Notices
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
