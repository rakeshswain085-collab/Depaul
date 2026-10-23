import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { getCurrentAdmin } from "@/lib/auth";
import { query } from "@/lib/database";
import {
  deleteStorageFile,
  publicStorageUrl,
  uploadStorageFile,
} from "@/lib/storage";
import { isSiteImageKey } from "@/lib/site-images";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    if (!(await getCurrentAdmin())) return fail("Unauthorized.", 401);

    const formData = await request.formData();
    const slot = formData.get("slot");
    const file = formData.get("file");
    if (typeof slot !== "string" || !isSiteImageKey(slot)) {
      return fail("Choose a valid website image section.");
    }
    if (!(file instanceof File) || file.size < 1) {
      return fail("Select an image to upload.");
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return fail("Image files must be 10 MB or smaller.");
    }
    if (!file.type.startsWith("image/")) {
      return fail("Only image files can be uploaded here.");
    }

    const input = Buffer.from(await file.arrayBuffer());
    let output: Buffer;
    try {
      output = await sharp(input, { limitInputPixels: 40_000_000 })
        .rotate()
        .resize({
          width: 2400,
          height: 2400,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();
    } catch {
      return fail("The selected file is not a valid or supported image.");
    }

    const current = await query<{ storagePath: string }>(
      "select storage_path as \"storagePath\" from website_images where slot = $1",
      [slot],
    );
    const storagePath = `${slot}/${randomUUID()}.webp`;

    await uploadStorageFile(
      "site-images",
      storagePath,
      new Uint8Array(output),
      "image/webp",
    );

    try {
      await query(
        `insert into website_images (slot, storage_path, content_type, updated_at)
         values ($1, $2, $3, now())
         on conflict (slot) do update
         set storage_path = excluded.storage_path,
             content_type = excluded.content_type,
             updated_at = excluded.updated_at`,
        [slot, storagePath, "image/webp"],
      );
    } catch (error) {
      console.error("Website image metadata save failed:", error);
      try {
        await deleteStorageFile("site-images", storagePath);
      } catch (cleanupError) {
        console.error("Failed to clean up an unreferenced website image:", cleanupError);
      }
      throw new Error("Image uploaded but could not be saved. Please retry.");
    }

    const oldStoragePath = current.rows[0]?.storagePath;
    if (oldStoragePath && oldStoragePath !== storagePath) {
      try {
        await deleteStorageFile("site-images", oldStoragePath);
      } catch (error) {
        console.error("Failed to remove the replaced website image:", error);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Website image updated.",
      slot,
      imageUrl: publicStorageUrl("site-images", storagePath),
      originalSize: input.byteLength,
      optimizedSize: output.byteLength,
    });
  } catch (error) {
    console.error("Website image upload failed:", error);
    return fail(
      error instanceof Error
        ? error.message
        : "Unable to upload website image.",
      500,
    );
  }
}
