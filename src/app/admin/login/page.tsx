"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Unable to sign in. Please check your credentials.");
        return;
      }

      router.replace(data.redirectTo || "/admin/dashboard");
      router.refresh();
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#071329] px-4 py-10 text-white selection:bg-amber-400 selection:text-slate-950">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-blue-500/10 blur-[100px]" />
        <div className="absolute -bottom-48 -right-32 h-[500px] w-[500px] rounded-full bg-amber-400/10 blur-[120px]" />

        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.25) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1930]/90 shadow-2xl shadow-black/40 backdrop-blur-xl md:grid-cols-2">
        {/* Branding panel */}
        <section className="relative flex flex-col justify-between overflow-hidden border-b border-white/10 bg-gradient-to-br from-[#10284b] via-[#0c1c35] to-[#091326] p-8 sm:p-10 md:border-b-0 md:border-r md:p-12">
          <div className="absolute -right-20 top-20 h-64 w-64 rounded-full border border-amber-300/10" />
          <div className="absolute -right-10 top-32 h-44 w-44 rounded-full border border-amber-300/10" />

          <div className="relative">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white p-1.5 shadow-lg shadow-black/20">
                <img
                  src="/images/school-logo.png"
                  alt="De-Paul School crest"
                  className="h-full w-full object-contain"
                />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                  School Administration
                </p>
                <h1 className="mt-1 text-lg font-bold tracking-wide text-white">
                  DE-PAUL SCHOOL
                </h1>
                <p className="mt-1 text-xs text-slate-400">Aska, Odisha</p>
              </div>
            </div>

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-medium text-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              Authorized personnel only
            </div>

            <h2 className="max-w-sm text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Your school.
              <br />
              <span className="text-amber-300">Your control.</span>
            </h2>

            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">
              A central workspace to manage school notices, events, gallery,
              academic resources and important announcements.
            </p>
          </div>

          <div className="relative mt-10 hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 md:block">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-300/10 text-amber-300">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7">
                  <path d="M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6l8-3Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Secure administration
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Sign in with your authorized administrator account to
                  continue.
                </p>
              </div>
            </div>
          </div>

          <p className="relative mt-8 text-xs tracking-wide text-slate-500">
            LEARN · GROW · EXCEL
          </p>
        </section>

        {/* Login panel */}
        <section className="flex items-center bg-[#0b172b] p-7 sm:p-10 md:p-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                Welcome back
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">
                Admin Login
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Enter your credentials to access the administration dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Email address
                </label>

                <div className="relative">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m4 7 8 6 8-6" />
                  </svg>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    placeholder="admin@school.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    maxLength={254}
                    disabled={loading}
                    className="h-13 w-full rounded-xl border border-slate-700 bg-[#101f35] pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 hover:border-slate-600 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Password
                </label>

                <div className="relative">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
                  >
                    <rect x="4" y="10" width="16" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    maxLength={256}
                    disabled={loading}
                    className="h-13 w-full rounded-xl border border-slate-700 bg-[#101f35] pl-12 pr-14 text-sm text-white outline-none transition placeholder:text-slate-500 hover:border-slate-600 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
                        <path d="M3 3 21 21" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 5.2A11.4 11.4 0 0 1 12 5c5.5 0 9 5.8 9 7s-1.4 3.3-3.7 4.9M6.2 6.2C3.9 7.7 3 10.8 3 12c0 1.2 3.5 7 9 7 1.2 0 2.3-.3 3.3-.7" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
                        <path d="M2.5 12s3.4-7 9.5-7 9.5 7 9.5 7-3.4 7-9.5 7-9.5-7-9.5-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mt-0.5 h-5 w-5 shrink-0">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v5m0 3h.01" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/10 transition hover:bg-amber-300 hover:shadow-amber-400/20 focus:outline-none focus:ring-4 focus:ring-amber-400/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 animate-spin">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
                      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in to dashboard
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 transition-transform group-hover:translate-x-1">
                      <path d="M5 12h14m-6-6 6 6-6 6" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                Secure access
              </span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>

            <div className="flex items-start justify-center gap-2 text-center text-xs leading-5 text-slate-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="mt-0.5 h-4 w-4 shrink-0 text-amber-300/70">
                <path d="M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6l8-3Z" />
              </svg>
              <p>Restricted to authorized school administrators.</p>
            </div>

            <p className="mt-8 text-center text-xs text-slate-600">
              © {new Date().getFullYear()} De-Paul Senior Secondary School
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
