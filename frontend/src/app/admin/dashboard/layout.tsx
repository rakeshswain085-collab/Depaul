
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentAdmin, destroyAdminSession } from "@/lib/auth";
const sections = [
  { label: "Overview", href: "/admin/dashboard" },
  { label: "Notices", href: "/admin/dashboard/notices" },
  { label: "Events", href: "/admin/dashboard/events" },
  { label: "Gallery", href: "/admin/dashboard/gallery" },
  { label: "Website Images", href: "/admin/dashboard/images" },
  {
    label: "Mandatory Disclosure",
    href: "/admin/dashboard/mandatory-disclosure",
  },
  { label: "Book List PDFs", href: "/admin/dashboard/book-list" },
  {
    label: "Leadership Messages",
    href: "/admin/dashboard/leadership-messages",
  },
  { label: "Admission Enquiries", href: "/admin/dashboard/enquiries" },
  { label: "Website Settings", href: "/admin/dashboard/settings" },
  { label: "Manage Admins", href: "/admin/dashboard/admins" },
];

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();

  if (!admin) redirect("/admin/login");

  async function signOut() {
    "use server";
    await destroyAdminSession();
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 md:flex">
      <aside className="w-full bg-slate-950 p-5 text-white md:min-h-screen md:w-72">
        <Link
          href="/admin/dashboard"
          className="block text-xl font-bold text-amber-400"
        >
          De-Paul Admin
        </Link>

        <p className="mt-2 break-words text-sm text-slate-400">
          {admin.email}
        </p>
        <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
          {admin.role}
        </p>

        <nav className="mt-8 grid grid-cols-2 gap-2 md:grid-cols-1">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              {section.label}
            </Link>
          ))}
        </nav>

        <form action={signOut} className="mt-6">
          <button
            type="submit"
            className="w-full rounded-lg border border-slate-700 px-3 py-2 text-left text-sm hover:bg-slate-800"
          >
            Sign out
          </button>
        </form>
      </aside>

      <main className="min-w-0 flex-1 p-5 md:p-8">{children}</main>
    </div>
  );
}
