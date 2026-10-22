import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../database/mongodb";
import { getCurrentAdmin } from "@/lib/auth";
import mongoose from "mongoose";
import { ObjectId, type Collection } from "mongodb";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGES = 20;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_CATEGORIES = new Set([
  "School Activities", "School Events", "School Memories", "Academic Activities",
  "Sports", "Cultural Programs", "Celebrations", "Other",
]);

type GalleryDocument = {
  _id: ObjectId;
  title: string;
  category: string;
  year: number;
  imageUrl: string;
  sourceType: "upload" | "url";
  originalUrl?: string;
  caption: string;
  createdAt: Date;
};

function collection(): Collection<GalleryDocument> {
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection is not ready.");
  return db.collection<GalleryDocument>("gallery");
}

async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

function normalizeImageUrl(raw: string): { imageUrl: string; originalUrl: string } {
  const trimmed = raw.trim();
  let url: URL;
  try { url = new URL(trimmed); } catch { throw new Error("Enter a valid full URL beginning with https://"); }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Only HTTP and HTTPS image links are allowed.");
  if (url.username || url.password) throw new Error("URLs containing usernames or passwords are not allowed.");

  const host = url.hostname.toLowerCase();
  let imageUrl = url.toString();
  // Google Drive file sharing URL: /file/d/FILE_ID/view or ?id=FILE_ID
  if (host === "drive.google.com" || host === "www.drive.google.com") {
    const pathMatch = url.pathname.match(/\/file\/d\/([\w-]+)/);
    const id = pathMatch?.[1] ?? url.searchParams.get("id");
    if (id) imageUrl = `https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`;
  }
  // Google Photos URLs are sharing pages, not stable direct image URLs; preserve them as links.
  return { imageUrl, originalUrl: trimmed };
}

function parseYear(value: FormDataEntryValue | null): number {
  const text = String(value ?? "").trim();
  const year = Number(text);
  if (!/^\d{4}$/.test(text) || !Number.isInteger(year) || year < 1900 || year > 2100) {
    throw new Error("Please provide a valid year between 1900 and 2100.");
  }
  return year;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    await connectDB();
    const photos = await collection().find({}).sort({ year: -1, createdAt: -1 }).toArray();
    return NextResponse.json(photos.map((p) => ({ ...p, _id: p._id.toString(), createdAt: p.createdAt.toISOString() })));
  } catch (error) {
    console.error("Admin gallery GET failed:", error);
    return NextResponse.json({ error: "Failed to load gallery photos." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const savedFiles: string[] = [];
  try {
    await connectDB();
    const form = await request.formData();
    const year = parseYear(form.get("year"));
    const category = String(form.get("category") ?? "").trim();
    const title = String(form.get("title") ?? "").trim().slice(0, 150);
    const caption = String(form.get("caption") ?? "").trim().slice(0, 300);
    const mode = String(form.get("sourceMode") ?? "upload");
    if (!ALLOWED_CATEGORIES.has(category)) return NextResponse.json({ error: "Choose a valid gallery category." }, { status: 400 });

    const docs: GalleryDocument[] = [];
    if (mode === "url") {
      const urls = form.getAll("imageUrls").map((x) => String(x).trim()).filter(Boolean);
      if (urls.length < 1 || urls.length > MAX_IMAGES) return NextResponse.json({ error: `Provide between 1 and ${MAX_IMAGES} image URLs.` }, { status: 400 });
      for (const raw of urls) {
        const normalized = normalizeImageUrl(raw);
        docs.push({ _id: new ObjectId(), year, category, title, caption, imageUrl: normalized.imageUrl, originalUrl: normalized.originalUrl, sourceType: "url", createdAt: new Date() });
      }
    } else if (mode === "upload") {
      const files = form.getAll("images").filter((entry): entry is File => entry instanceof File && entry.size > 0);
      if (files.length < 1 || files.length > MAX_IMAGES) return NextResponse.json({ error: `Choose between 1 and ${MAX_IMAGES} images.` }, { status: 400 });
      const uploadDir = path.join(process.cwd(), "public", "uploads", "gallery");
      await mkdir(uploadDir, { recursive: true });
      for (const file of files) {
        if (!ALLOWED_MIME.has(file.type)) throw new Error(`${file.name}: use JPG, PNG, WEBP, or GIF.`);
        if (file.size > MAX_FILE_SIZE) throw new Error(`${file.name}: maximum image size is 10 MB.`);
        const extension = ({ "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif" } as Record<string, string>)[file.type];
        const filename = `${randomUUID()}${extension}`;
        const diskPath = path.join(uploadDir, filename);
        await writeFile(diskPath, Buffer.from(await file.arrayBuffer()));
        savedFiles.push(diskPath);
        docs.push({ _id: new ObjectId(), year, category, title: title || file.name.slice(0, 150), caption, imageUrl: `/uploads/gallery/${filename}`, sourceType: "upload", createdAt: new Date() });
      }
    } else {
      return NextResponse.json({ error: "Invalid image source mode." }, { status: 400 });
    }

    await collection().insertMany(docs);
    return NextResponse.json({ success: true, count: docs.length, photos: docs.map((p) => ({ ...p, _id: p._id.toString(), createdAt: p.createdAt.toISOString() })) }, { status: 201 });
  } catch (error) {
    await Promise.all(savedFiles.map((file) => unlink(file).catch(() => undefined)));
    const message = error instanceof Error ? error.message : "Image upload failed.";
    const status = /valid full URL|HTTP and HTTPS|username|valid year|maximum image size|use JPG/i.test(message) ? 400 : 500;
    console.error("Admin gallery POST failed:", error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    await connectDB();
    const id = request.nextUrl.searchParams.get("id");
    if (!id || !/^[a-f\d]{24}$/i.test(id)) return NextResponse.json({ error: "A valid image ID is required." }, { status: 400 });
    const col = collection();
    const photo = await col.findOne({ _id: new ObjectId(id) });
    if (!photo) return NextResponse.json({ error: "Image not found." }, { status: 404 });
    await col.deleteOne({ _id: photo._id });
    if (photo.imageUrl.startsWith("/uploads/gallery/")) {
      const diskPath = path.join(process.cwd(), "public", photo.imageUrl.replace(/^\//, ""));
      await unlink(diskPath).catch(() => undefined);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin gallery DELETE failed:", error);
    return NextResponse.json({ error: "Failed to delete image." }, { status: 500 });
  }
}
