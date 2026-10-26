
import Link from "next/link";
import { getCurrentAdmin } from "@/lib/auth";

const dashboardItems = [
  {
    title: "Notices",
    description: "Publish announcements and circulars.",
    href: "/admin/dashboard/notices",
  },
  {
    title: "Events",
    description: "Manage upcoming and completed school events.",
    href: "/admin/dashboard/events",
  },
  {
    title: "Gallery",
    description: "Add Google Drive photo and video links.",
    href: "/admin/dashboard/gallery",
  },
  {
    title: "Website Images",
    description: "Replace the logo, campus photos, and featured website images.",
    href: "/admin/dashboard/images",
  },
  {
    title: "Mandatory Disclosure",
    description: "Manage required school documents.",
    href: "/admin/dashboard/mandatory-disclosure",
  },
  {
    title: "Book Lists",
    description: "Maintain class-wise booklists and PDF links.",
    href: "/admin/dashboard/book-lists",
  },
  {
    title: "Leadership Messages",
    description: "Update Chairman and Principal messages.",
    href: "/admin/dashboard/leadership",
  },
  {
    title: "Admission Enquiries",
    description: "Review enquiries submitted by parents.",
    href: "/admin/dashboard/enquiries",
  },
  {
    title: "Website Settings",
    description: "Manage school website information.",
    href: "/admin/dashboard/settings",
  },
  {
    title: "Admin Accounts",
    description: "Manage authorized dashboard users.",
    href: "/admin/dashboard/admin-accounts",
  },
  {
    title: "Exam Results",
    description:
      "Upload Excel marksheets, review student marks, and publish or unpublish examination results.",
    href: "/admin/dashboard/exam-results",
    featured: true,
  },
];

export default async function AdminDashboardPage() {
  const admin = await getCurrentAdmin();

  return (
    <main className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
        School Administration
      </p>

      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        Dashboard
      </h1>

      <p className="mt-3 text-slate-600">
        Welcome{admin?.name ? `, ${admin.name}` : ""}. Manage the De-Paul
        School website from one place.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {dashboardItems.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className={`group rounded-xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md ${
              item.featured
                ? "border-amber-300 bg-amber-50/60 hover:border-amber-400"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-bold text-slate-900">{item.title}</h2>
              <span
                aria-hidden="true"
                className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700"
              >
                →
              </span>
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {item.description}
            </p>

            <p className="mt-4 text-sm font-semibold text-slate-700">
              Manage {item.title.toLowerCase()}
            </p>
          </Link>
        ))}
      </div>

      <p className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Use the dashboard to manage school website content and examination
        results. Only authorized administrators should be able to publish
        student marks.
      </p>
    </main>
  );
}
