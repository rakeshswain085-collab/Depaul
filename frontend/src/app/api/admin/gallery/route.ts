import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { query } from "@/lib/database";
import { getCurrentAdmin } from "@/lib/auth";
import {
  deleteStorageFile,
  publicStorageUrl,
  uploadStorageFile,
} from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "gallery-images";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 20;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

type GalleryRow = {
  id: string;
  year: number;
  category: string;
  title: string;
  caption: string;
  imageUrl: string;
  originalUrl: string | null;
  sourceType: string;
  createdAt: Date | string;
};

function errorResponse(error: string, status = 500) {
  return NextResponse.json({ success: false, error }, { status });
}

function serialize(row: GalleryRow) {
  return {
    _id: row.id,
    id: row.id,
    year: row.year,
    category: row.category,
    title: row.title,
    caption: row.caption,
    imageUrl: row.imageUrl,
    originalUrl: row.originalUrl ?? "",
    sourceType: row.sourceType,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

function validateMetadata(form: FormData) {
  const rawYear = String(form.get("year") ?? "").trim();
  const year = Number(rawYear);
  const category = String(form.get("category") ?? "").trim();
  const title = String(form.get("title") ?? "").trim();
  const caption = String(form.get("caption") ?? "").trim();

  if (
    !/^\d{4}$/.test(rawYear) ||
    !Number.isInteger(year) ||
    year < 1900 ||
    year > 2100
  ) {
    throw new Error("Enter a valid year between 1900 and 2100.");
  }
  if (!category || category.length > 100) {
    throw new Error("Choose a valid gallery category.");
  }
  if (title.length > 150 || caption.length > 300) {
    throw new Error("Title or caption is too long.");
  }

  return { year, category, title, caption };
}

async function isAdmin() {
  return Boolean(await getCurrentAdmin());
}

export async function GET() {
  try {
    if (!(await isAdmin())) return errorResponse("Unauthorized.", 401);

    const { rows } = await query<GalleryRow>(
      `select id, year, category, title, caption, image_url as "imageUrl",
        original_url as "originalUrl", source_type as "sourceType",
        created_at as "createdAt"
       from gallery
       order by year desc, created_at desc`,
    );

    const photos = rows.map(serialize);
    return NextResponse.json({ success: true, photos, items: photos });
  } catch (error) {
    console.error("Admin gallery GET failed:", error);
    return errorResponse("Failed to load gallery photos.");
  }
}

export async function POST(request: NextRequest) {
  const uploadedPaths: string[] = [];

  try {
    if (!(await isAdmin())) return errorResponse("Unauthorized.", 401);

    const form = await request.formData();
    const { year, category, title, caption } = validateMetadata(form);
    const files = form
      .getAll("images")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (files.length === 0 || files.length > MAX_FILES) {
      return errorResponse(`Select between 1 and ${MAX_FILES} images.`, 400);
    }

    for (const file of files) {
      if (!ALLOWED_TYPES[file.type]) {
        return errorResponse(
          `${file.name}: use JPG, PNG, WEBP, or GIF.`,
          400,
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return errorResponse(`${file.name} must be smaller than 10 MB.`, 400);
      }
    }

    const records: Array<{
      id: string;
      year: number;
      category: string;
      title: string;
      caption: string;
      imageUrl: string;
      storagePath: string;
      originalBytes: number;
      compressedBytes: number;
    }> = [];

    for (const file of files) {
      const input = Buffer.from(await file.arrayBuffer());
      const image = sharp(input, {
        animated: file.type === "image/gif",
        limitInputPixels: 40_000_000,
      });
      const metadata = await image.metadata();

      if (
        !metadata.format ||
        metadata.format !== ALLOWED_TYPES[file.type]
      ) {
        throw new Error(`${file.name} is not a valid ${file.type} image.`);
      }

      const output = await image
        .rotate()
        .resize({
          width: 1920,
          height: 1920,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();

      const id = randomUUID();
      const storagePath = `${id}.webp`;
      const photoTitle = title || file.name.replace(/\.[^.]+$/, "").slice(0, 150);

      uploadedPaths.push(storagePath);
      await uploadStorageFile(BUCKET, storagePath, output, "image/webp");

      records.push({
        id,
        year,
        category,
        title: photoTitle,
        caption,
        imageUrl: publicStorageUrl(BUCKET, storagePath),
        storagePath,
        originalBytes: input.byteLength,
        compressedBytes: output.byteLength,
      });
    }

    const values: unknown[] = [];
    const placeholders = records.map((record, index) => {
      const offset = index * 10;
      values.push(
        record.id,
        record.year,
        record.category,
        record.title,
        record.caption,
        record.imageUrl,
        null,
        "upload",
        record.storagePath,
        new Date(),
      );
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4},
        $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8},
        $${offset + 9}, $${offset + 10})`;
    });

    const { rows } = await query<GalleryRow>(
      `insert into gallery
        (id, year, category, title, caption, image_url, original_url,
         source_type, storage_path, created_at)
       values ${placeholders.join(", ")}
       returning id, year, category, title, caption, image_url as "imageUrl",
         original_url as "originalUrl", source_type as "sourceType",
         created_at as "createdAt"`,
      values,
    );

    const totalOriginalBytes = records.reduce(
      (total, record) => total + record.originalBytes,
      0,
    );
    const totalCompressedBytes = records.reduce(
      (total, record) => total + record.compressedBytes,
      0,
    );

    return NextResponse.json(
      {
        success: true,
        count: rows.length,
        photos: rows.map(serialize),
        compression: {
          originalBytes: totalOriginalBytes,
          compressedBytes: totalCompressedBytes,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Admin gallery POST failed:", error);

    const cleanupResults = await Promise.allSettled(
      uploadedPaths.map((path) => deleteStorageFile(BUCKET, path)),
    );
    cleanupResults.forEach((result) => {
      if (result.status === "rejected") {
        console.error("Gallery upload cleanup failed:", result.reason);
      }
    });

    const message =
      error instanceof Error ? error.message : "Image upload failed.";
    const status =
      /valid year|category|too long|use JPG|smaller than|valid .* image/i.test(
        message,
      )
        ? 400
        : 500;
    return errorResponse(message, status);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAdmin())) return errorResponse("Unauthorized.", 401);

    const id = request.nextUrl.searchParams.get("id")?.trim() ?? "";
    if (!id || id.length > 100) {
      return errorResponse("A valid image ID is required.", 400);
    }

    const { rows } = await query<{ storagePath: string | null }>(
      `delete from gallery
       where id = $1
       returning storage_path as "storagePath"`,
      [id],
    );
    const record = rows[0];
    if (!record) return errorResponse("Gallery image not found.", 404);

    if (record.storagePath) {
      await deleteStorageFile(BUCKET, record.storagePath);
    }

    return NextResponse.json({
      success: true,
      message: "Gallery image deleted successfully.",
    });
  } catch (error) {
    console.error("Admin gallery DELETE failed:", error);
    return errorResponse("Failed to delete gallery image.");
  }
}
