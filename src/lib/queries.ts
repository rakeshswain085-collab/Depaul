
import {
  ADMISSION,
  BOOK_LIST,
  EVENTS,
  GALLERY_PHOTOS,
  MESSAGES,
  NOTICES,
  type BookListItem as RawBookListItem,
  type GalleryPhoto as RawGalleryPhoto,
  type LeadershipMessage as RawLeadershipMessage,
  type Notice as RawNotice,
  type SchoolEvent as RawSchoolEvent,
} from "@/lib/content";

/** Row types used across the site (content + a stable id). */
export type Notice = Omit<RawNotice, "isPinned"> & {
  id: number;
  isPinned: boolean;
};

export type SchoolEvent = Omit<RawSchoolEvent, "status"> & {
  id: number;
  status: string;
};

export type GalleryPhoto = RawGalleryPhoto & {
  id: number | string;
  year?: number;
};

export type LeadershipMessage = RawLeadershipMessage & { id: number };
export type BookListItem = RawBookListItem & { id: number };

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
];

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export function formatLongDate(value: string): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatShortDate(value: string): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return `${String(date.getDate()).padStart(2, "0")} ${MONTHS[date.getMonth()]}`;
}

function withIds<T>(items: T[]): Array<T & { id: number }> {
  return items.map((item, index) => ({
    ...item,
    id: index + 1,
  }));
}

/** Get notices, sorted with pinned notices first. */
export function getNotices(limit?: number): Notice[] {
  const rows = withIds(NOTICES)
    .map((notice) => ({
      ...notice,
      isPinned: Boolean(notice.isPinned),
    }))
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.noticeDate.localeCompare(a.noticeDate);
    });

  return limit ? rows.slice(0, limit) : rows;
}

/** Get upcoming events first, followed by completed events. */
export function getEvents(limit?: number): SchoolEvent[] {
  const byDate = (a: SchoolEvent, b: SchoolEvent) =>
    a.eventDate.localeCompare(b.eventDate);

  const rows = withIds(EVENTS);

  const upcoming = rows
    .filter((event) => event.status.toLowerCase() === "upcoming")
    .sort(byDate);

  const completed = rows
    .filter((event) => event.status.toLowerCase() !== "upcoming")
    .sort(byDate);

  const all = [...upcoming, ...completed];

  return limit ? all.slice(0, limit) : all;
}

/** Convert a value into a usable gallery year. */
function resolveGalleryYear(
  year: unknown,
  category: string,
): number | undefined {
  const fieldYear = Number(year);

  if (Number.isInteger(fieldYear) && fieldYear >= 1900 && fieldYear <= 2200) {
    return fieldYear;
  }

  const categoryYear = Number(
    category.match(/\b(?:19|20)\d{2}\b/)?.[0] ?? 0,
  );

  return categoryYear || undefined;
}

/** Build the existing static gallery photos as a fallback. */
function getStaticGalleryPhotos(): GalleryPhoto[] {
  return withIds(GALLERY_PHOTOS).map((photo) => ({
    ...photo,
    year: resolveGalleryYear(
      (photo as RawGalleryPhoto & { year?: number | string }).year,
      photo.category,
    ),
  }));
}

/**
 * Fetch gallery photos from the public MongoDB API.
 *
 * This is an async function. Server components must use:
 * const photos = await getGalleryPhotos();
 */
export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  const staticPhotos = getStaticGalleryPhotos();

  try {
    // This function is intended to run in a Next.js server component.
    const { headers } = await import("next/headers");
    const requestHeaders = await headers();
    const host = requestHeaders.get("host");

    if (!host) return staticPhotos;

    const forwardedProtocol = requestHeaders
      .get("x-forwarded-proto")
      ?.split(",")[0]
      ?.trim();

    const protocol =
      forwardedProtocol ||
      (process.env.NODE_ENV === "development" ? "http" : "https");

    const response = await fetch(`${protocol}://${host}/api/gallery`, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Gallery API returned status:", response.status);
      return staticPhotos;
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      console.error("Gallery API returned an unexpected response.");
      return staticPhotos;
    }

    const databasePhotos: GalleryPhoto[] = data
      .filter(
        (item): item is Record<string, unknown> =>
          typeof item === "object" && item !== null,
      )
      .map((item, index) => {
        const category =
          typeof item.category === "string" && item.category.trim()
            ? item.category.trim()
            : "School Memories";

        const storedImageUrl =
          typeof item.imageUrl === "string" ? item.imageUrl.trim() : "";

        const originalUrl =
          typeof item.originalUrl === "string" ? item.originalUrl.trim() : "";

        // The public API should resolve GridFS IDs to image-serving URLs.
        const imageUrl = storedImageUrl || originalUrl;

        return {
          id: String(item.id ?? item._id ?? `database-${index}`),
          title: typeof item.title === "string" ? item.title : "",
          category,
          imageUrl,
          caption: typeof item.caption === "string" ? item.caption : "",
          year: resolveGalleryYear(item.year, category),
          sortOrder:
            typeof item.sortOrder === "number" ? item.sortOrder : 0,
        } as GalleryPhoto;
      })
      .filter((photo) => Boolean(photo.imageUrl));

    // Use database photos when available, otherwise preserve existing photos.
    return databasePhotos.length > 0 ? databasePhotos : staticPhotos;
  } catch (error) {
    console.error("Unable to load gallery from MongoDB:", error);
    return staticPhotos;
  }
}

/** Group photos by year, newest year first. */
export function groupPhotosByYear(photos: GalleryPhoto[]) {
  const groups = new Map<number, GalleryPhoto[]>();

  for (const photo of photos) {
    const year =
      Number(photo.year) ||
      Number(photo.category.match(/\b(?:19|20)\d{2}\b/)?.[0] ?? 0);

    if (!year) continue;

    const list = groups.get(year) ?? [];
    list.push(photo);
    groups.set(year, list);
  }

  return [...groups.entries()]
    .sort(([yearA], [yearB]) => yearB - yearA)
    .map(([year, items]) => ({
      category: String(year),
      year,
      items: [...items].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
      ),
    }));
}

/** Group photos by event category. */
export function groupPhotosByCategory(photos: GalleryPhoto[]) {
  const groups = new Map<string, GalleryPhoto[]>();

  for (const photo of photos) {
    const category = photo.category || "School Memories";
    const list = groups.get(category) ?? [];

    list.push(photo);
    groups.set(category, list);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, items]) => ({
      category,
      items: [...items].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
      ),
    }));
}

/** Backward-compatible function for existing pages. */
export function groupPhotos(photos: GalleryPhoto[]) {
  return groupPhotosByCategory(photos);
}

export function getMessages(): LeadershipMessage[] {
  return withIds(MESSAGES).sort((a, b) => a.role.localeCompare(b.role));
}

export function getMessage(
  role: string,
): LeadershipMessage | undefined {
  return getMessages().find((message) => message.role === role);
}

export function getSettings(): Record<string, string> {
  return { ...ADMISSION };
}

export function getBookList(): BookListItem[] {
  return withIds(BOOK_LIST);
}
