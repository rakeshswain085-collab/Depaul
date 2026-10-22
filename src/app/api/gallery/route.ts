
import { NextResponse } from "next/server";
import { connectDB } from "../../../../database/mongodb";
import mongoose from "mongoose";
import { type Collection, ObjectId } from "mongodb";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type GalleryDocument = {
  _id: ObjectId;
  title?: string;
  category?: string;
  year?: number | string;
  imageUrl?: string;
  imageId?: string;
  sourceType?: "upload" | "url";
  originalUrl?: string;
  caption?: string;
  createdAt?: Date;
};

function isObjectId(value: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(value);
}

function resolveImageUrl(photo: GalleryDocument): string {
  const storedUrl = photo.imageUrl?.trim() ?? "";
  const imageId = photo.imageId?.trim() ?? "";

  // Use the GridFS serving route for a stored GridFS ObjectId.
  if (imageId && isObjectId(imageId)) {
    return `/api/gallery/image/${imageId}`;
  }

  // Support records where imageUrl itself contains the GridFS ObjectId.
  if (isObjectId(storedUrl)) {
    return `/api/gallery/image/${storedUrl}`;
  }

  // Preserve existing local paths and external URLs.
  return storedUrl || photo.originalUrl || "";
}

export async function GET() {
  try {
    await connectDB();

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("MongoDB connection is not ready.");
    }

    const col: Collection<GalleryDocument> = db.collection("gallery");

    const photos = await col
      .find({})
      .sort({ year: -1, createdAt: -1 })
      .toArray();

    const result = photos.map((photo) => ({
      _id: photo._id.toString(),
      id: photo._id.toString(),
      title: photo.title ?? "",
      category: photo.category ?? "School Gallery",
      year: photo.year ?? "",
      imageUrl: resolveImageUrl(photo),
      sourceType: photo.sourceType ?? "url",
      originalUrl: photo.originalUrl ?? "",
      caption: photo.caption ?? "",
      createdAt: photo.createdAt?.toISOString() ?? null,
    }));

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Public gallery GET failed:", error);

    return NextResponse.json(
      { error: "Unable to load gallery." },
      { status: 500 },
    );
  }
}
