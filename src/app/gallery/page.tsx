
import type { Metadata } from "next";
import mongoose from "mongoose";
import { connectDB } from "../../../database/mongodb";
import { GalleryViewer } from "@/components/gallery-viewer";
import { PageHero, Section } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Photo Gallery",
  description:
    "Photographs of the campus, activities, events and memories of De-Paul Senior Secondary School, Aska.",
};

type GalleryDocument = {
  _id: mongoose.Types.ObjectId;
  title?: string;
  category?: string;
  year?: number;
  imageUrl?: string;
  caption?: string;
  createdAt?: Date;
};

export default async function GalleryPage() {
  await connectDB();

  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB connection is not ready.");
  }

  const documents = await db
    .collection<GalleryDocument>("gallery")
    .find({ published: { $ne: false } })
    .sort({ year: -1, createdAt: -1 })
    .toArray();

  const photos = documents
    .filter((photo) => Boolean(photo.imageUrl))
    .map((photo, index) => ({
      id: index + 1,
      title: photo.title ?? "",
      imageUrl: photo.imageUrl!,
      caption: photo.caption ?? "",
      category: String(photo.year ?? photo.category ?? "Other"),
      year: photo.year ?? null,
      createdAt: photo.createdAt?.toISOString() ?? "",
    }));

  const groupMap = new Map<
    string,
    typeof photos
  >();

  for (const photo of photos) {
    const group = groupMap.get(photo.category) ?? [];
    group.push(photo);
    groupMap.set(photo.category, group);
  }

  const groups = [...groupMap.entries()]
    .map(([category, items]) => ({ category, items }))
    .sort((a, b) => {
      const yearA = Number(a.category);
      const yearB = Number(b.category);

      if (Number.isFinite(yearA) && Number.isFinite(yearB)) {
        return yearB - yearA;
      }

      return b.category.localeCompare(a.category);
    });

  const total = photos.length;

  return (
    <>
      <PageHero
        breadcrumb="Gallery"
        title="School Gallery"
        subtitle={`${total} photograph${total === 1 ? "" : "s"} across our school years. The latest year appears first.`}
      />

      <Section className="bg-slate-50">
        {groups.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            No photographs have been published yet.
          </p>
        ) : (
          <GalleryViewer groups={groups} />
        )}
      </Section>
    </>
  );
}
