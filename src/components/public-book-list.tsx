"use client";

import { useEffect, useMemo, useState } from "react";

type Book = {
  id: string;
  title: string;
  author: string;
  subject: string;
  className: string;
  publisher: string;
  academicYear: string;
  price: number | null;
};

export function PublicBookList() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [className, setClassName] = useState("All");
  const [year, setYear] = useState("All");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/book-list", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Unable to load books.");
        setBooks(Array.isArray(data.books) ? data.books : []);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Unable to load books.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const classes = useMemo(() => [...new Set(books.map((b) => b.className))].sort(), [books]);
  const years = useMemo(() => [...new Set(books.map((b) => b.academicYear))].sort().reverse(), [books]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return books.filter((b) =>
      (className === "All" || b.className === className) &&
      (year === "All" || b.academicYear === year) &&
      (!q || [b.title, b.author, b.subject, b.publisher].some((v) => v.toLowerCase().includes(q)))
    );
  }, [books, search, className, year]);

  return (
    <div>
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_200px_160px]">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Search books<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Title, author, subject…" className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm font-normal normal-case tracking-normal text-slate-900" /></label>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Class<select value={className} onChange={(e) => setClassName(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-normal normal-case tracking-normal text-slate-900"><option>All</option>{classes.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Academic year<select value={year} onChange={(e) => setYear(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-normal normal-case tracking-normal text-slate-900"><option>All</option>{years.map((y) => <option key={y}>{y}</option>)}</select></label>
      </div>

      {loading ? <p className="py-12 text-center text-sm text-slate-500">Loading book list…</p> : error ? <p role="status" className="py-12 text-center text-sm text-red-700">Unable to load the book list right now.</p> : filtered.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">No published books match your search.</div> : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-slate-950 text-xs uppercase tracking-wider text-white"><tr>{["Book title", "Class", "Subject", "Author", "Publisher", "Year", "Price"].map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">{filtered.map((book) => <tr key={book.id} className="hover:bg-amber-50/40"><td className="px-4 py-4 font-semibold text-slate-900">{book.title}</td><td className="px-4 py-4">{book.className}</td><td className="px-4 py-4">{book.subject}</td><td className="px-4 py-4">{book.author}</td><td className="px-4 py-4">{book.publisher}</td><td className="px-4 py-4">{book.academicYear}</td><td className="px-4 py-4">{book.price == null ? "—" : `₹${book.price.toFixed(2)}`}</td></tr>)}</tbody>
          </table>
        </div>
      )}
      {!loading && !error && filtered.length > 0 && <p className="mt-3 text-right text-xs text-slate-500">Showing {filtered.length} book{filtered.length === 1 ? "" : "s"}</p>}
    </div>
  );
}
