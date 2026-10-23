import { getCurrentAdmin } from "@/lib/auth";
import ExamResultsManager from "./results-manager";

export const dynamic = "force-dynamic";

export default async function ExamResultsAdminPage() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-bold text-slate-900">Exam Results</h1>
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Please sign in with an active administrator account to manage examination results.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
        School Administration
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        Exam Results Management
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        Upload a marksheet, review validation results, save it as a draft, and publish it when verified.
      </p>
      <div className="mt-6">
        <ExamResultsManager />
      </div>
    </main>
  );
}
