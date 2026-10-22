import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDisclosureDatabase } from "@/lib/mandatory-disclosure";
import { STAFF_PHOTO_BUCKET, validId } from "@/lib/staff";
import { GridFSBucket } from "mongodb";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    if (!validId(id)) return NextResponse.json({ error: "Invalid photo ID." }, { status: 400 });

    const db = await getDisclosureDatabase();
    const bucket = new GridFSBucket(db, { bucketName: STAFF_PHOTO_BUCKET });
    const photoId = new ObjectId(id);
    const file = await db.collection(`${STAFF_PHOTO_BUCKET}.files`).findOne({ _id: photoId });
    if (!file) return NextResponse.json({ error: "Photo not found." }, { status: 404 });

    const contentType = String(file.metadata?.contentType ?? "");
    if (!["image/jpeg", "image/png", "image/webp"].includes(contentType)) {
      return NextResponse.json({ error: "Unsupported photo type." }, { status: 415 });
    }

    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      const stream = bucket.openDownloadStream(photoId);
      stream.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
      stream.on("end", resolve);
      stream.on("error", reject);
    });
    const body = Buffer.concat(chunks);
    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(body.length),
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("GET /api/staff/photo/[id]:", error);
    return NextResponse.json({ error: "Unable to load photo." }, { status: 500 });
  }
}
