
"use client";

import { useState } from "react";
import { SCHOOL } from "@/lib/site";

const SUBJECTS = [
  "Admission Enquiry",
  "Admission Procedure",
  "Fee Structure",
  "Required Documents",
  "Class Availability",
  "Age Eligibility",
  "Transfer Certificate",
  "Transport Facility",
  "School Timings",
  "Academic Information",
  "General Enquiry",
  "Other",
];

export function EnquiryForm() {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const field =
    "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-navy-900 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-200";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);

    const name = String(data.get("name") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const selectedSubject = String(data.get("subject") ?? "");
    const otherSubject = String(data.get("otherSubject") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    const subject =
      selectedSubject === "Other" ? otherSubject : selectedSubject;

    setNote("");
    setError("");

    if (!name || !phone || !message || !subject) {
      setError("Please complete all required fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          email,
          subject,
          message,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to submit your enquiry.");
      }

      setNote(
        "Thank you! Your enquiry has been submitted successfully. The school office will contact you.",
      );

      form.reset();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Unable to submit your enquiry. Please contact ${SCHOOL.email}.`,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <h3 className="text-base font-bold text-navy-800 sm:text-lg">
        Admission Enquiry Form
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm">
        Complete the form below and the school office will receive your enquiry.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block min-w-0">
          <span className="mb-1 block text-xs font-bold text-slate-600">
            FULL NAME *
          </span>
          <input
            required
            name="name"
            maxLength={120}
            autoComplete="name"
            className={field}
          />
        </label>

        <label className="block min-w-0">
          <span className="mb-1 block text-xs font-bold text-slate-600">
            PHONE *
          </span>
          <input
            required
            name="phone"
            type="tel"
            maxLength={20}
            inputMode="tel"
            autoComplete="tel"
            className={field}
          />
        </label>

        <label className="block min-w-0">
          <span className="mb-1 block text-xs font-bold text-slate-600">
            EMAIL
          </span>
          <input
            name="email"
            type="email"
            maxLength={140}
            autoComplete="email"
            className={field}
          />
        </label>

        <label className="block min-w-0">
          <span className="mb-1 block text-xs font-bold text-slate-600">
            SUBJECT *
          </span>
          <select
            name="subject"
            defaultValue="Admission Enquiry"
            className={field}
          >
            {SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </label>

        <label className="block min-w-0 sm:col-span-2">
          <span className="mb-1 block text-xs font-bold text-slate-600">
            IF OTHER, SPECIFY SUBJECT
          </span>
          <input
            name="otherSubject"
            maxLength={120}
            placeholder="Optional — complete this if you selected Other"
            className={field}
          />
        </label>
      </div>

      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-bold text-slate-600">
          MESSAGE *
        </span>
        <textarea
          required
          name="message"
          rows={3}
          maxLength={1000}
          className={field}
          placeholder="Write your enquiry here..."
        />
      </label>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {note && (
        <p
          role="status"
          className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
        >
          {note}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 flex min-h-10 w-full items-center justify-center rounded-lg bg-navy-800 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Submitting..." : "Submit Enquiry"}
      </button>

      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        Prefer to call? Contact the school office at{" "}
        <a
          href={`tel:${SCHOOL.phoneHref}`}
          className="font-semibold text-navy-700 hover:underline"
        >
          {SCHOOL.phone}
        </a>
        .
      </p>
    </form>
  );
}
