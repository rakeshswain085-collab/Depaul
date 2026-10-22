import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { Readable } from "node:stream";
import { getStaffPhotoBucket, MAX_STAFF_PHOTO_SIZE } from "@/lib/staff";

export const runtime = "nodejs";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export async function POST(request: NextRequest) {
  let uploadedId: ObjectId | null = null;
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
    if (!ALLOWED_TYPES[file.type]) return NextResponse.json({ error: "Upload a JPG, PNG, or WebP image." }, { status: 400 });
    if (file.size <= 0 || file.size > MAX_STAFF_PHOTO_SIZE) {
      return NextResponse.json({ error: "Photo must be smaller than 5 MB." }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = ALLOWED_TYPES[file.type];
    const safeName = `staff-${Date.now()}${ext}`;
    const bucket = await getStaffPhotoBucket();
    const upload = bucket.openUploadStream(safeName, {
      metadata: {
        contentType: file.type,
        originalName: file.name.slice(0, 180),
      },
    });
    uploadedId = upload.id as ObjectId;

    await new Promise<void>((resolve, reject) => {
      Readable.from(bytes).pipe(upload);
      upload.once("finish", resolve);
      upload.once("error", reject);
    });

    return NextResponse.json({
      photoId: uploadedId.toHexString(),
      photoUrl: `/api/staff/photo/${uploadedId.toHexString()}`,
      fileName: safeName,
      fileSize: file.size,
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/staff/upload-photo:", error);
    if (uploadedId) {
      try { const bucket = await getStaffPhotoBucket(); await bucket.delete(uploadedId); } catch {}
    }
    return NextResponse.json({ error: "Unable to upload photo." }, { status: 500 });
  }
}
