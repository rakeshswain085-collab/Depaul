"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { compareSchoolClasses } from "@/lib/school-classes";

type Book = {
  _id: string;
  title: string;
  author: string;
  subject: string;
  className: string;
  publisher: string;
  academicYear: string;
  price: number | null;
  published: boolean;
};

type BookForm = Omit<Book, "_id">;

const newForm = (): BookForm => ({
  title: "", author: "", subject: "", className: "Class 1",
  publisher: "", academicYear: "2026-27", price: null, published: false,
});

const inputClass = "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100";

export default function BookListAdminPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [form, setForm] = useState<BookForm>(newForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadBooks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/book-list", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to load books.");
      setBooks(Array.isArray(data.books) ? data.books : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load books.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadBooks(); }, [loadBooks]);

  const classes = useMemo(
    () =>
      [...new Set(books.map((book) => book.className))].sort(
        compareSchoolClasses,
      ),
    [books],
  );
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return books.filter((book) =>
      (classFilter === "All" || book.className === classFilter) &&
      (!q || [book.title, book.author, book.subject, book.publisher, book.academicYear].some((v) => v.toLowerCase().includes(q)))
    );
  }, [books, search, classFilter]);

  function reset() {
    setForm(newForm());
    setEditingId(null);
  }

  function edit(book: Book) {
    setEditingId(book._id);
    setForm({
      title: book.title, author: book.author, subject: book.subject,
      className: book.className, publisher: book.publisher,
      academicYear: book.academicYear, price: book.price, published: book.published,
    });
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/book-list", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...(editingId ? { id: editingId } : {}) }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to save book.");
      setMessage(editingId ? "Book updated." : "Book added.");
      reset();
      await loadBooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save book.");
    } finally { setSaving(false); }
  }

  async function togglePublish(book: Book) {
    setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/book-list", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: book._id, published: !book.published }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to change publication.");
      setMessage(book.published ? "Book unpublished." : "Book published on the public website.");
      await loadBooks();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to update book."); }
  }

  async function remove(book: Book) {
    if (!window.confirm(`Delete "${book.title}" permanently?`)) return;
    setError(""); setMessage("");
    try {
      const response = await fetch(`/api/admin/book-list?id=${encodeURIComponent(book._id)}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to delete book.");
      if (editingId === book._id) reset();
      setMessage("Book deleted.");
      await loadBooks();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to delete book."); }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">School administration</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Book List Management</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Manage class-wise textbooks and publish verified lists for students and parents.</p>
          </div>
          <a href="/book-list" target="_blank" rel="noreferrer" className="w-fit rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-100">Preview public list ↗</a>
        </header>

        {(error || message) && <div role="status" className={`rounded-xl border p-4 text-sm ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>{error || message}</div>}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-wider text-amber-600">{editingId ? "Edit book" : "New book"}</p><h2 className="mt-1 text-xl font-bold">{editingId ? "Update book details" : "Add a book"}</h2></div>
            {editingId && <button type="button" onClick={reset} className="rounded-lg border px-3 py-2 text-sm font-semibold">Cancel edit</button>}
          </div>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-semibold">Book title<input required maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Mathematics textbook" /></label>
            <label className="text-sm font-semibold">Author<input required maxLength={160} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className={inputClass} placeholder="Author name" /></label>
            <label className="text-sm font-semibold">Subject<input required maxLength={100} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inputClass} placeholder="Mathematics" /></label>
            <label className="text-sm font-semibold">Class
              <select value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} className={inputClass}>
                {["Pre-Nursery", "Nursery", "LKG", "UKG", ...Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`)].map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">Publisher<input required maxLength={160} value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} className={inputClass} placeholder="Publisher name" /></label>
            <label className="text-sm font-semibold">Academic year<input required pattern="\d{4}-\d{2}" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} className={inputClass} placeholder="2026-27" /></label>
            <label className="text-sm font-semibold">Price (₹, optional)<input type="number" min="0" step="0.01" value={form.price ?? ""} onChange={(e) => setForm({ ...form, price: e.target.value === "" ? null : Number(e.target.value) })} className={inputClass} placeholder="0.00" /></label>
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="h-4 w-4 accent-amber-500" />Publish after saving</label>
            <div className="flex flex-wrap items-center gap-3 md:col-span-2 lg:col-span-3"><button disabled={saving} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50">{saving ? "Saving…" : editingId ? "Save changes" : "Add book"}</button><button type="button" onClick={reset} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold hover:bg-slate-50">Clear form</button></div>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><h2 className="text-xl font-bold">All books</h2><p className="mt-1 text-sm text-slate-600">{books.length} books · {books.filter((b) => b.published).length} published</p></div>
            <div className="flex flex-col gap-2 sm:flex-row"><input value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Search title, author, subject…" /><select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"><option value="All">All classes</option>{classes.map((c) => <option key={c}>{c}</option>)}</select><button type="button" onClick={() => void loadBooks()} className="rounded-xl border px-3 py-2 text-sm font-semibold">Refresh</button></div>
          </div>

          {loading ? <p className="py-10 text-center text-sm text-slate-500">Loading books…</p> : filtered.length === 0 ? <div className="mt-5 rounded-xl border border-dashed p-10 text-center text-sm text-slate-500">No books found. Add your first book above.</div> : (
            <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr>{["Book", "Class / Subject", "Publisher", "Academic year", "Price", "Status", "Actions"].map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">{filtered.map((book) => <tr key={book._id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-4"><p className="font-bold">{book.title}</p><p className="mt-1 text-xs text-slate-500">{book.author}</p></td>
                  <td className="px-4 py-4"><p>{book.className}</p><p className="mt-1 text-xs text-slate-500">{book.subject}</p></td>
                  <td className="px-4 py-4">{book.publisher}</td><td className="px-4 py-4">{book.academicYear}</td><td className="px-4 py-4">{book.price == null ? "—" : `₹${book.price.toFixed(2)}`}</td>
                  <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${book.published ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{book.published ? "Published" : "Draft"}</span></td>
                  <td className="px-4 py-4"><div className="flex flex-wrap gap-2"><button onClick={() => edit(book)} className="rounded-lg border px-2.5 py-1.5 text-xs font-bold">Edit</button><button onClick={() => void togglePublish(book)} className="rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-bold text-emerald-800">{book.published ? "Unpublish" : "Publish"}</button><button onClick={() => void remove(book)} className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-bold text-red-700">Delete</button></div></td>
                </tr>)}</tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
