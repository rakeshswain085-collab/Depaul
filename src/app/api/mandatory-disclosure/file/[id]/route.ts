
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import {
  DISCLOSURE_COLLECTION,
  DISCLOSURE_CONTENT_COLLECTION,
  getDisclosureBucket,
  getDisclosureDatabase,
  isValidObjectId,
} from "@/lib/mandatory-disclosure";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { message: "Invalid file ID." },
        { status: 400 }
      );
    }

    const db = await getDisclosureDatabase();
    const fileId = new ObjectId(id);
    const fileIdString = fileId.toHexString();

    // First check the existing disclosure collection.
    const existingPublishedDocument = await db
      .collection(DISCLOSURE_COLLECTION)
      .findOne({
        fileId,
        published: true,
      });

    // Then check documents saved inside the admin content record.
    const savedContentDocument = await db
      .collection(DISCLOSURE_CONTENT_COLLECTION)
      .findOne({
        $or: [
          {
            "documentsAndCertifications.groups.documents": {
              $elemMatch: {
                fileId: fileIdString,
                published: true,
              },
            },
          },
          {
            "resultsAndAcademics.records": {
              $elemMatch: {
                fileId: fileIdString,
                published: true,
              },
            },
          },
        ],
      });

    if (!existingPublishedDocument && !savedContentDocument) {
      return NextResponse.json(
        { message: "Published document not found." },
        { status: 404 }
      );
    }

    const file = await db
      .collection(`${"mandatoryDisclosureFiles"}.files`)
      .findOne({ _id: fileId });

    if (!file) {
      return NextResponse.json(
        { message: "PDF not found." },
        { status: 404 }
      );
    }

    const bucket = await getDisclosureBucket();
    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      const stream = bucket.openDownloadStream(fileId);

      stream.on("data", (chunk: Buffer) => {
        chunks.push(Buffer.from(chunk));
      });

      stream.on("error", reject);
      stream.on("end", resolve);
    });

    const pdf = Buffer.concat(chunks);
    const filename = String(
      file.filename ?? "disclosure.pdf"
    ).replace(/["\r\n]/g, "_");

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdf.length),
        "Content-Disposition": `inline; filename="${filename}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error(
      "Mandatory disclosure PDF retrieval failed:",
      error
    );

    return NextResponse.json(
      { message: "Unable to open this PDF." },
      { status: 500 }
    );
  }
}
