import { PublicBookList } from "@/components/public-book-list";

export const dynamic = "force-dynamic";

export default function BookListPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300">Student resources</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">School Book List</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Find the recommended books for your class and academic year. Use the filters to locate a subject or title.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <PublicBookList />
      </section>
    </main>
  );
}
