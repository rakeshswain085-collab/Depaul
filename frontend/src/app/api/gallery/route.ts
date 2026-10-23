
import { NextResponse } from "next/server";
import { query } from "@/lib/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type GalleryRow = {
  id: string;
  title: string;
  category: string;
  year: number;
  imageUrl: string;
  sourceType: string;
  originalUrl: string | null;
  caption: string;
  createdAt: Date;
};

export async function GET() {
  try {
    const { rows: photos } = await query<GalleryRow>(
      `select id, title, category, year, image_url as "imageUrl",
        source_type as "sourceType", original_url as "originalUrl",
        caption, created_at as "createdAt"
       from gallery
       order by year desc, created_at desc`,
    );

    const result = photos.map((photo) => ({
      _id: photo.id,
      id: photo.id,
      title: photo.title,
      category: photo.category,
      year: photo.year,
      imageUrl: photo.imageUrl,
      sourceType: photo.sourceType,
      originalUrl: photo.originalUrl ?? "",
      caption: photo.caption,
      createdAt: photo.createdAt.toISOString(),
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
