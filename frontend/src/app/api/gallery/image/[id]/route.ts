
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../../database/mongodb";
import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";
import { Readable } from "stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // A MongoDB ObjectId must contain exactly 24 hexadecimal characters.
    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return NextResponse.json(
        {
          error: "Invalid image ID.",
          message:
            "The image ID must contain exactly 24 hexadecimal characters.",
        },
        { status: 400 }
      );
    }

    const imageId = new ObjectId(id);

    await connectDB();

    const db = mongoose.connection.db;

    if (!db) {
      return NextResponse.json(
        { error: "Database connection is unavailable." },
        { status: 500 }
      );
    }

    const bucket = new GridFSBucket(db, {
      bucketName: "galleryImages",
    });

    // Confirm the image exists before opening the download stream.
    const file = await db
      .collection("galleryImages.files")
      .findOne({ _id: imageId });

    if (!file) {
      return NextResponse.json(
        { error: "Image not found in GridFS." },
        { status: 404 }
      );
    }

    const contentType =
      typeof file.metadata?.contentType === "string"
        ? file.metadata.contentType
        : "application/octet-stream";

    // Only serve supported image formats.
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
    ];

    if (!allowedTypes.includes(contentType.toLowerCase())) {
      return NextResponse.json(
        { error: "Unsupported image content type." },
        { status: 415 }
      );
    }

    const downloadStream = bucket.openDownloadStream(imageId);
    const webStream = Readable.toWeb(downloadStream) as ReadableStream;

    return new Response(webStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Gallery image API error:", error);

    return NextResponse.json(
      { error: "Unable to load image." },
      { status: 500 }
    );
  }
}
