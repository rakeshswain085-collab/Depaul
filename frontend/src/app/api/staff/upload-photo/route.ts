import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import {
  publicStorageUrl,
  uploadStorageFile,
} from "@/lib/storage";
import { MAX_STAFF_PHOTO_SIZE, STAFF_PHOTO_BUCKET } from "@/lib/staff";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Upload a JPG, PNG, or WebP image." }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_STAFF_PHOTO_SIZE) {
      return NextResponse.json({ error: "Photo must be smaller than 5 MB." }, { status: 400 });
    }

    const input = Buffer.from(await file.arrayBuffer());
    const image = sharp(input, { limitInputPixels: 20_000_000 });
    const metadata = await image.metadata();
    const expectedFormat = file.type === "image/jpeg" ? "jpeg" : file.type.slice(6);

    if (metadata.format !== expectedFormat) {
      return NextResponse.json({ error: "The uploaded file is not a valid image." }, { status: 400 });
    }

    const output = await image
      .rotate()
      .resize({
        width: 1200,
        height: 1200,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();

    const photoId = `${randomUUID()}.webp`;
    await uploadStorageFile(STAFF_PHOTO_BUCKET, photoId, output, "image/webp");

    return NextResponse.json(
      {
        photoId,
        photoUrl: publicStorageUrl(STAFF_PHOTO_BUCKET, photoId),
        fileName: photoId,
        fileSize: output.byteLength,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/staff/upload-photo:", error);
    return NextResponse.json({ error: "Unable to upload photo." }, { status: 500 });
  }
}
