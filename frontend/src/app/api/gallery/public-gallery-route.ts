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
  year?: number;
  imageUrl: string;
  sourceType?: "upload" | "url";
  originalUrl?: string;
  caption?: string;
  createdAt?: Date;
};

export async function GET() {
  try {
    await connectDB();
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection is not ready.");
    const col: Collection<GalleryDocument> = db.collection("gallery");
    const photos = await col.find({}).sort({ year: -1, createdAt: -1 }).toArray();
    return NextResponse.json(
      photos.map((p) => ({ ...p, _id: p._id.toString(), createdAt: p.createdAt?.toISOString() ?? null })),
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Public gallery GET failed:", error);
    return NextResponse.json({ error: "Unable to load gallery." }, { status: 500 });
  }
}
