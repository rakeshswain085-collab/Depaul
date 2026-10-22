import { NextResponse } from "next/server";
import {
  DISCLOSURE_COLLECTION,
  getDisclosureDatabase,
  toDisclosureResponse,
} from "@/lib/mandatory-disclosure";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDisclosureDatabase();

    const documents = await db
      .collection(DISCLOSURE_COLLECTION)
      .find({ published: true })
      .sort({ category: 1, title: 1 })
      .toArray();

    return NextResponse.json(
      {
        success: true,
        data: documents.map((doc) =>
          toDisclosureResponse(doc as Record<string, unknown>)
        ),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Public disclosure GET failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load published disclosures." },
      { status: 500 }
    );
  }
}