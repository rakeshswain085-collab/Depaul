
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "node:stream";
import {
  getDisclosureBucket,
  MAX_DISCLOSURE_FILE_SIZE,
} from "@/lib/mandatory-disclosure";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    // Validate uploaded file
    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "Please select a PDF file." },
        { status: 400 }
      );
    }

    // Validate extension and MIME type
    if (
      file.type !== "application/pdf" ||
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      return NextResponse.json(
        { success: false, message: "Only PDF files are allowed." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size < 1 || file.size > MAX_DISCLOSURE_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "PDF size must be greater than 0 and no more than 10 MB.",
        },
        { status: 400 }
      );
    }

    // Read and verify PDF signature
    const bytes = Buffer.from(await file.arrayBuffer());

    if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
      return NextResponse.json(
        { success: false, message: "The uploaded file is not a valid PDF." },
        { status: 400 }
      );
    }

    // Connect to MongoDB GridFS
    const bucket = await getDisclosureBucket();

    // Sanitize filename
    const safeName = file.name
      .replace(/[^\w.-]+/g, "_")
      .slice(0, 180) || "disclosure.pdf";

    // IMPORTANT: contentType belongs in metadata, not at the
    // top level of GridFSBucketWriteStreamOptions.
    const uploadStream = bucket.openUploadStream(safeName, {
      metadata: {
        originalName: safeName,
        contentType: "application/pdf",
      },
    });

    // Upload to GridFS and wait for completion
    await new Promise<void>((resolve, reject) => {
      Readable.from(bytes)
        .pipe(uploadStream)
        .on("error", reject)
        .on("finish", resolve);
    });

    return NextResponse.json(
      {
        success: true,
        message: "PDF uploaded successfully.",
        data: {
          fileId: uploadStream.id.toString(),
          fileName: safeName,
          fileSize: file.size,
          contentType: "application/pdf",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Mandatory disclosure upload failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "PDF upload failed. Please try again.",
      },
      { status: 500 }
    );
  }
}
