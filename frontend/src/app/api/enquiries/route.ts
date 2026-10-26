import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_LENGTH = 1000;

function errorResponse(error: string, status = 400) {
  return NextResponse.json(
    { success: false, error },
    { status, headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (origin && host && new URL(origin).host !== host) {
      return errorResponse("Invalid request origin.", 403);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Request body must be valid JSON.");
    }
    if (!body || typeof body !== "object") {
      return errorResponse("Enter valid enquiry details.");
    }

    const data = body as Record<string, unknown>;
    const name = typeof data.name === "string" ? data.name.trim() : "";
    const phone = typeof data.phone === "string" ? data.phone.trim() : "";
    const phoneDigits = phone.replace(/\D/g, "");
    const email =
      typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
    const subject =
      typeof data.subject === "string" ? data.subject.trim() : "";
    const message =
      typeof data.message === "string" ? data.message.trim() : "";

    if (!name || name.length > 120) {
      return errorResponse("Enter your name (maximum 120 characters).");
    }
    if (
      !phone ||
      phone.length > 20 ||
      phoneDigits.length < 7 ||
      phoneDigits.length > 15 ||
      !/^[+\d()\s.-]+$/.test(phone)
    ) {
      return errorResponse("Enter a valid phone number.");
    }
    if (
      email.length > 140 ||
      (email !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    ) {
      return errorResponse("Enter a valid email address.");
    }
    if (!subject || subject.length > 120) {
      return errorResponse("Choose a valid enquiry subject.");
    }
    if (!message || message.length > MAX_BODY_LENGTH) {
      return errorResponse(
        `Enter an enquiry message (maximum ${MAX_BODY_LENGTH} characters).`,
      );
    }

    const result = await query<{ id: string }>(
      `insert into admission_enquiries (name, phone, email, subject, message)
       values ($1, $2, $3, $4, $5)
       returning id`,
      [name, phone, email, subject, message],
    );

    return NextResponse.json(
      { success: true, id: result.rows[0].id },
      {
        status: 201,
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  } catch (error) {
    console.error("Public admission enquiry submission failed:", error);
    return errorResponse("Unable to submit your enquiry. Please try again.", 500);
  }
}