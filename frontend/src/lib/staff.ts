export const STAFF_PHOTO_BUCKET = "staff-photos";
export const MAX_STAFF_PHOTO_SIZE = 5 * 1024 * 1024;

export const STAFF_CATEGORIES = [
  "PGT Teachers",
  "TGT Teachers",
  "PRT Teachers",
] as const;

export type StaffCategory = (typeof STAFF_CATEGORIES)[number];

const CATEGORY_MAP: Record<string, StaffCategory> = {
  PGT: "PGT Teachers",
  "PGT TEACHERS": "PGT Teachers",
  TGT: "TGT Teachers",
  "TGT TEACHERS": "TGT Teachers",
  PRT: "PRT Teachers",
  "PRT TEACHERS": "PRT Teachers",
};

export function normalizeStaffCategory(value: unknown): StaffCategory | null {
  if (typeof value !== "string") return null;
  return CATEGORY_MAP[value.trim().toUpperCase()] ?? null;
}

export function isStaffCategory(value: unknown): value is StaffCategory {
  return normalizeStaffCategory(value) !== null;
}

export function isValidStaffPhotoPath(value: string): boolean {
  return /^[\w-]+\.(?:webp|jpe?g|png)$/i.test(value);
}
