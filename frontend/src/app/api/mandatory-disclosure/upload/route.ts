import { randomUUID } from "node:crypto";
import { basename, extname } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { getCurrentAdmin } from "@/lib/auth";
import { uploadStorageFile } from "@/lib/storage";
import { MAX_DISCLOSURE_FILE_SIZE } from "@/lib/mandatory-disclosure";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "mandatory-disclosure-files";
const MAX_INPUT_PIXELS = 40_000_000;
const IMAGE_EXTENSIONS = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".tif",
  ".tiff",
  ".webp",
]);

function responseError(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

function safeExtension(fileName: string) {
  const extension = extname(fileName).toLowerCase();
  return /^\.[a-z0-9]{1,10}$/.test(extension) ? extension : "";
}

function safeFileName(fileName: string) {
  return basename(fileName)
    .replace(/[^\w.-]+/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 180) || "document";
}

export async function POST(request: NextRequest) {
  try {
    if (!(await getCurrentAdmin())) {
      return responseError("Unauthorized.", 401);
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return responseError("Please select a document to upload.", 400);
    }
    if (file.size < 1 || file.size > MAX_DISCLOSURE_FILE_SIZE) {
      return responseError("The document must be greater than 0 and no more than 10 MB.", 400);
    }

    const input = Buffer.from(await file.arrayBuffer());
    const originalName = safeFileName(file.name);
    const extension = safeExtension(file.name);
    const isPdf =
      file.type === "application/pdf" ||
      extension === ".pdf" ||
      input.subarray(0, 5).toString("ascii") === "%PDF-";
    let output = input;
    let contentType = file.type || "application/octet-stream";
    let outputExtension = extension;

    if (isPdf) {
      if (input.subarray(0, 5).toString("ascii") !== "%PDF-") {
        return responseError("The uploaded file is not a valid PDF.", 400);
      }
      try {
        const document = await PDFDocument.load(input, {
          updateMetadata: false,
          throwOnInvalidObject: true,
        });
        const compressed = Buffer.from(
          await document.save({ useObjectStreams: true }),
        );
        if (compressed.length < input.length) output = compressed;
      } catch {
        return responseError("The PDF could not be processed. Try an unencrypted PDF.", 400);
      }
      contentType = "application/pdf";
      outputExtension = ".pdf";
    } else if (
      file.type.startsWith("image/") ||
      IMAGE_EXTENSIONS.has(extension)
    ) {
      try {
        const image = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS });
        const metadata = await image.metadata();
        if (!metadata.format) {
          return responseError("The uploaded file is not a valid image.", 400);
        }
        output = await image
          .rotate()
          .resize({
            width: 2400,
            height: 2400,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 82, effort: 4 })
          .toBuffer();
        contentType = "image/webp";
        outputExtension = ".webp";
      } catch {
        return responseError("The uploaded image could not be processed.", 400);
      }
    }

    const fileId = `${randomUUID()}${outputExtension}`;
    await uploadStorageFile(BUCKET, fileId, output, contentType);

    return NextResponse.json(
      {
        success: true,
        message: "Document uploaded successfully.",
        data: {
          fileId,
          fileName: originalName,
          fileSize: output.byteLength,
          originalFileSize: input.byteLength,
          contentType,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Mandatory disclosure upload failed:", error);
    return responseError("Document upload failed. Please try again.", 500);
  }
}
