
import { GridFSBucket, ObjectId } from "mongodb";
import {
  getDisclosureDatabase,
  isValidObjectId,
} from "@/lib/mandatory-disclosure";

export const STAFF_COLLECTION = "school_staff";
export const STAFF_PHOTO_BUCKET = "schoolStaffPhotos";
export const MAX_STAFF_PHOTO_SIZE = 5 * 1024 * 1024;

export const STAFF_CATEGORIES = [
  "PGT Teachers",
  "TGT Teachers",
  "PRT Teachers",
] as const;

export type StaffCategory = (typeof STAFF_CATEGORIES)[number];

export type StaffRecord = {
  _id: string;
  name: string;
  designation: string;
  subject: string;
  category: StaffCategory;
  photoId: string;
  photoUrl: string;
  published: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

const CATEGORY_MAP: Record<string, StaffCategory> = {
  PGT: "PGT Teachers",
  "PGT TEACHERS": "PGT Teachers",
  TGT: "TGT Teachers",
  "TGT TEACHERS": "TGT Teachers",
  PRT: "PRT Teachers",
  "PRT TEACHERS": "PRT Teachers",
};

export function normalizeStaffCategory(
  value: unknown
): StaffCategory | null {
  if (typeof value !== "string") return null;

  return CATEGORY_MAP[value.trim().toUpperCase()] ?? null;
}

export function isStaffCategory(
  value: unknown
): value is StaffCategory {
  return normalizeStaffCategory(value) !== null;
}

export async function getStaffCollection() {
  const db = await getDisclosureDatabase();
  return db.collection(STAFF_COLLECTION);
}

export async function getStaffPhotoBucket() {
  const db = await getDisclosureDatabase();

  // Keep staff photos separate from mandatory-disclosure PDFs.
  return new GridFSBucket(db, {
    bucketName: STAFF_PHOTO_BUCKET,
  });
}

export function validId(value: string) {
  return isValidObjectId(value);
}

export function serializeStaff(
  doc: Record<string, unknown>
): StaffRecord {
  const id =
    doc._id instanceof ObjectId
      ? doc._id.toHexString()
      : String(doc._id ?? "");

  const rawPhoto = doc.photoId;

  const photoId =
    rawPhoto instanceof ObjectId
      ? rawPhoto.toHexString()
      : String(rawPhoto ?? "");

  const parseDate = (value: unknown) => {
    const parsed =
      value instanceof Date
        ? value
        : new Date(String(value ?? ""));

    return Number.isNaN(parsed.getTime())
      ? new Date().toISOString()
      : parsed.toISOString();
  };

  return {
    _id: id,
    name: String(doc.name ?? ""),
    designation: String(doc.designation ?? ""),
    subject: String(doc.subject ?? ""),
    category:
      normalizeStaffCategory(doc.category) ?? "PGT Teachers",
    photoId,
    photoUrl: photoId
      ? `/api/staff/photo/${photoId}`
      : "",
    published: doc.published === true,
    sortOrder: Number(doc.sortOrder ?? 0),
    createdAt: parseDate(doc.createdAt),
    updatedAt: parseDate(doc.updatedAt),
  };
}