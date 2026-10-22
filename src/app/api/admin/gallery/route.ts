
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../database/mongodb";
import { getCurrentAdmin } from "@/lib/auth";
import mongoose from "mongoose";
import { ObjectId, GridFSBucket } from "mongodb";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 20;
const MAX_URLS = 20;

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

type GalleryDocument = {
  _id: ObjectId;
  title?: string;
  category?: string;
  year?: number;
  imageUrl: string;
  originalUrl?: string;
  sourceType?: "upload" | "url" | "legacy";
  gridFsId?: string;
  contentType?: string;
  caption?: string;
  createdAt?: Date;
};

function getDB() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection is not ready.");
  return db;
}

function getCollection() {
  return getDB().collection<GalleryDocument>("gallery");
}

function getBucket() {
  return new GridFSBucket(getDB(), {
    bucketName: "galleryImages",
  });
}

async function authorizeAdmin() {
  return Boolean(await getCurrentAdmin());
}

function responseError(error: unknown, status = 500) {
  console.error("Gallery API error:", error);

  return NextResponse.json(
    {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gallery request failed.",
    },
    { status },
  );
}

function serialize(item: GalleryDocument) {
  return {
    ...item,
    _id: item._id.toString(),
    id: item._id.toString(),
    createdAt: item.createdAt?.toISOString(),
  };
}

function normalizeImageUrl(value: string) {
  const parsed = new URL(value.trim());

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are allowed.");
  }

  if (parsed.username || parsed.password) {
    throw new Error("URLs containing credentials are not allowed.");
  }

  const host = parsed.hostname.toLowerCase();

  if (
    host === "drive.google.com" ||
    host === "www.drive.google.com"
  ) {
    const match = parsed.pathname.match(/\/file\/d\/([^/]+)/);
    const fileId = match?.[1] || parsed.searchParams.get("id") || "";

    if (!/^[a-zA-Z0-9_-]+$/.test(fileId)) {
      throw new Error("Use a valid Google Drive sharing link.");
    }

    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  return parsed.toString();
}

function validateMetadata(form: FormData) {
  const rawYear = String(form.get("year") ?? "").trim();
  const year = Number(rawYear);
  const title = String(form.get("title") ?? "").trim();
  const category = String(
    form.get("category") ?? "School Activities",
  ).trim();
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
    throw new Error("Enter a valid gallery category.");
  }

  if (title.length > 150 || caption.length > 300) {
    throw new Error("Title or caption is too long.");
  }

  return { year, title, category, caption };
}

// GET: List gallery images for the admin dashboard.
export async function GET() {
  try {
    if (!(await authorizeAdmin())) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    await connectDB();

    const items = await getCollection()
      .find({})
      .sort({ year: -1, createdAt: -1 })
      .toArray();

    const photos = items.map(serialize);

    return NextResponse.json({
      success: true,
      photos,
      items: photos,
    });
  } catch (error) {
    return responseError(error);
  }
}

// POST: Store image uploads in GridFS or save external image URLs.
export async function POST(request: NextRequest) {
  const uploadedIds: ObjectId[] = [];

  try {
    if (!(await authorizeAdmin())) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    await connectDB();

    const form = await request.formData();
    const { year, title, category, caption } = validateMetadata(form);
    const sourceMode = String(form.get("sourceMode") ?? "upload");

    const collection = getCollection();
    const documents: GalleryDocument[] = [];

    if (sourceMode === "url") {
      const rawUrls = String(
        form.get("imageUrls") ?? form.get("imageUrl") ?? "",
      );

      const urls = rawUrls
        .split(/\r?\n/)
        .map((url) => url.trim())
        .filter(Boolean);

      if (urls.length === 0 || urls.length > MAX_URLS) {
        return NextResponse.json(
          {
            success: false,
            error: `Provide between 1 and ${MAX_URLS} URLs.`,
          },
          { status: 400 },
        );
      }

      const normalizedUrls = urls.map(normalizeImageUrl);

      for (const imageUrl of normalizedUrls) {
        documents.push({
          _id: new ObjectId(),
          year,
          title,
          category,
          caption,
          imageUrl,
          originalUrl: imageUrl,
          sourceType: "url",
          createdAt: new Date(),
        });
      }
    } else if (sourceMode === "upload") {
      const files = form
        .getAll("images")
        .filter((entry): entry is File => entry instanceof File);

      if (files.length === 0 || files.length > MAX_FILES) {
        return NextResponse.json(
          {
            success: false,
            error: `Select between 1 and ${MAX_FILES} images.`,
          },
          { status: 400 },
        );
      }

      for (const file of files) {
        if (!ALLOWED_TYPES[file.type]) {
          return NextResponse.json(
            {
              success: false,
              error: `${file.name}: use JPG, PNG, WEBP or GIF.`,
            },
            { status: 400 },
          );
        }

        if (file.size === 0 || file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            {
              success: false,
              error: `${file.name} must be smaller than 10 MB.`,
            },
            { status: 400 },
          );
        }
      }

      const bucket = getBucket();

      for (const file of files) {
        const fileId = new ObjectId();
        const extension = ALLOWED_TYPES[file.type];
        const filename = `${fileId.toString()}${extension}`;

        const uploadStream = bucket.openUploadStream(filename, {
          id: fileId,
          metadata: {
            originalName: file.name,
            contentType: file.type,
            uploadedAt: new Date(),
          },
        });

        try {
          await pipeline(
            Readable.from([
              Buffer.from(await file.arrayBuffer()),
            ]),
            uploadStream,
          );
        } catch (error) {
          await bucket.delete(fileId).catch(() => undefined);
          throw error;
        }

        uploadedIds.push(fileId);

        documents.push({
          _id: new ObjectId(),
          year,
          title: title || file.name.replace(/\.[^.]+$/, ""),
          category,
          caption,
          gridFsId: fileId.toString(),
          contentType: file.type,
          imageUrl: `/api/gallery/image/${fileId.toString()}`,
          sourceType: "upload",
          createdAt: new Date(),
        });
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid image source." },
        { status: 400 },
      );
    }

    try {
      await collection.insertMany(documents);
    } catch (error) {
      const bucket = getBucket();

      await Promise.all(
        uploadedIds.map((id) =>
          bucket.delete(id).catch(() => undefined),
        ),
      );

      uploadedIds.length = 0;
      return responseError(error);
    }

    const photos = documents.map(serialize);

    return NextResponse.json(
      {
        success: true,
        message:
          sourceMode === "upload"
            ? "Images stored in MongoDB GridFS."
            : "Image URLs saved successfully.",
        photos,
        items: photos,
      },
      { status: 201 },
    );
  } catch (error) {
    try {
      if (uploadedIds.length > 0) {
        const bucket = getBucket();

        await Promise.all(
          uploadedIds.map((id) =>
            bucket.delete(id).catch(() => undefined),
          ),
        );
      }
    } catch (cleanupError) {
      console.error("GridFS cleanup failed:", cleanupError);
    }

    return responseError(error);
  }
}

// DELETE: Remove the gallery record and its GridFS file, if present.
export async function DELETE(request: NextRequest) {
  try {
    if (!(await authorizeAdmin())) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    await connectDB();

    const id = request.nextUrl.searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "A valid image ID is required." },
        { status: 400 },
      );
    }

    const collection = getCollection();
    const objectId = new ObjectId(id);
    const item = await collection.findOne({ _id: objectId });

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Gallery image not found." },
        { status: 404 },
      );
    }

    if (item.gridFsId && ObjectId.isValid(item.gridFsId)) {
      try {
        await getBucket().delete(new ObjectId(item.gridFsId));
      } catch (error) {
        console.error("Could not delete GridFS file:", error);

        return NextResponse.json(
          {
            success: false,
            error: "Could not remove the image file from GridFS.",
          },
          { status: 500 },
        );
      }
    }

    const result = await collection.deleteOne({ _id: objectId });

    if (!result.deletedCount) {
      return NextResponse.json(
        { success: false, error: "Could not delete gallery image." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Gallery image deleted successfully.",
    });
  } catch (error) {
    return responseError(error);
  }
}
