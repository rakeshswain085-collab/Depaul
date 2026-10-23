"use client";

import { useState } from "react";
import { SCHOOL } from "@/lib/site";

export function EnquiryForm() {
  const [note, setNote] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const subject = String(data.get("subject") ?? "Admission Enquiry").trim();
    const message = String(data.get("message") ?? "").trim();

    const body = [
      `Name: ${name}`,
      `Phone: ${phone}`,
      email ? `Email: ${email}` : "",
      "",
      message,
    ]
      .filter(Boolean)
      .join("\n");

    const href = `mailto:${SCHOOL.email}?subject=${encodeURIComponent(
      `${subject} — ${name}`,
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
    setNote(
      "Your email app should open with the enquiry ready to send. If it does not, please write to us directly at " +
        SCHOOL.email +
        ".",
    );
  }

  const field =
    "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-navy-900 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-200";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h3 className="text-lg font-bold text-navy-800">Admission Enquiry Form</h3>
      <p className="mt-1 text-sm text-slate-600">
        Fill in the details below — your email app will open with everything ready
        to send to the school office.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
            Full Name *
          </span>
          <input required name="name" maxLength={120} className={field} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
            Phone *
          </span>
          <input
            required
            name="phone"
            maxLength={20}
            inputMode="tel"
            className={field}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
            Email
          </span>
          <input name="email" type="email" maxLength={140} className={field} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
            Subject
          </span>
          <select name="subject" defaultValue="Admission Enquiry" className={field}>
            <option>Admission Enquiry</option>
            <option>General Enquiry</option>
            <option>Transport Enquiry</option>
            <option>Fee Related</option>
          </select>
        </label>
      </div>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
          Message *
        </span>
        <textarea
          required
          name="message"
          rows={4}
          maxLength={1000}
          className={field}
        />
      </label>

      <button
        type="submit"
        className="mt-5 w-full rounded-lg bg-navy-800 px-5 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-navy-700"
      >
        Send Enquiry
      </button>

      {note ? (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {note}
        </p>
      ) : null}

      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        Prefer to call? Reach the school office at{" "}
        <a className="font-semibold text-navy-700" href={`tel:${SCHOOL.phoneHref}`}>
          {SCHOOL.phone}
        </a>
        .
      </p>
    </form>
  );
}
