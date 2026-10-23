import { NextRequest, NextResponse } from "next/server";
import { downloadStorageFile } from "@/lib/storage";
import { isValidStaffPhotoPath, STAFF_PHOTO_BUCKET } from "@/lib/staff";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    if (!isValidStaffPhotoPath(id)) {
      return NextResponse.json({ error: "Invalid photo ID." }, { status: 400 });
    }

    const response = await downloadStorageFile(STAFF_PHOTO_BUCKET, id);
    if (!response) {
      return NextResponse.json({ error: "Photo not found." }, { status: 404 });
    }

    const body = await response.arrayBuffer();
    return new NextResponse(body, {
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "image/webp",
        "Content-Length": String(body.byteLength),
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("GET /api/staff/photo/[id]:", error);
    return NextResponse.json({ error: "Unable to load photo." }, { status: 500 });
  }
}
