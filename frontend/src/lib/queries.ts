
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
export function getStaticGalleryPhotos(): GalleryPhoto[] {
  return withIds(GALLERY_PHOTOS).map((photo) => ({
    ...photo,
    year: resolveGalleryYear(
      (photo as RawGalleryPhoto & { year?: number | string }).year,
      photo.category,
    ),
  }));
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
