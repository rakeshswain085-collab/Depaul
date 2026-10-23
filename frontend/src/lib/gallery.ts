import "server-only";
import { query } from "@/lib/database";
import {
  getStaticGalleryPhotos,
  type GalleryPhoto,
} from "@/lib/queries";

type GalleryRow = {
  id: string;
  title: string;
  category: string;
  year: number;
  imageUrl: string;
  caption: string;
};

export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  try {
    const { rows } = await query<GalleryRow>(
      `select id, title, category, year, image_url as "imageUrl", caption
       from gallery
       order by year desc, created_at desc`,
    );

    const databasePhotos = rows
      .filter((photo) => Boolean(photo.imageUrl))
      .map((photo) => ({
        id: photo.id,
        title: photo.title,
        category: photo.category || "School Memories",
        imageUrl: photo.imageUrl,
        caption: photo.caption,
        year: photo.year,
        sortOrder: 0,
      }));

    return databasePhotos.length > 0
      ? databasePhotos
      : getStaticGalleryPhotos();
  } catch (error) {
    console.error("Unable to load gallery from Supabase:", error);
    return getStaticGalleryPhotos();
  }
}
