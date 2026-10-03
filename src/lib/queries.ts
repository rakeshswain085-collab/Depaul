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
export type Notice = Omit<RawNotice, "isPinned"> & { id: number; isPinned: boolean };
export type SchoolEvent = Omit<RawSchoolEvent, "status"> & {
  id: number;
  status: string;
};
export type GalleryPhoto = RawGalleryPhoto & { id: number };
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

/** Formats an ISO date string (YYYY-MM-DD) as e.g. "23 Sept 2026". */
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
  return items.map((item, index) => ({ ...item, id: index + 1 }));
}

export function getNotices(limit?: number): Notice[] {
  const rows = withIds(NOTICES)
    .map((notice) => ({ ...notice, isPinned: Boolean(notice.isPinned) }))
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.noticeDate.localeCompare(a.noticeDate);
    });
  return limit ? rows.slice(0, limit) : rows;
}

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

export function getGalleryPhotos(): GalleryPhoto[] {
  return withIds(GALLERY_PHOTOS);
}

export function getMessages(): LeadershipMessage[] {
  return withIds(MESSAGES).sort((a, b) => a.role.localeCompare(b.role));
}

export function getMessage(role: string): LeadershipMessage | undefined {
  return getMessages().find((message) => message.role === role);
}

export function getSettings(): Record<string, string> {
  return { ...ADMISSION };
}

export function getBookList(): BookListItem[] {
  return withIds(BOOK_LIST);
}

export function groupPhotos(photos: GalleryPhoto[]) {
  const groups = new Map<string, GalleryPhoto[]>();
  for (const photo of photos) {
    const list = groups.get(photo.category) ?? [];
    list.push(photo);
    groups.set(photo.category, list);
  }
  return [...groups.entries()].map(([category, items]) => ({
    category,
    items: [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
  }));
}
