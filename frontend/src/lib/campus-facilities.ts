import "server-only";
import { query } from "@/lib/database";
import {
  CAMPUS_STARTER_FACILITIES,
  type CampusFacility,
} from "@/lib/facilities-campus";
import { isSiteImageKey } from "@/lib/site-images";

type CampusFacilityRow = Omit<CampusFacility, "imageSlot"> & {
  imageSlot: string | null;
};

const FACILITY_FIELDS = `id, slug, photo_category as "photoCategory",
  title, description, icon, image_slot as "imageSlot",
  sort_order as "sortOrder", published`;

function isMissingFacilitiesTable(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "42P01"
  );
}
function mapFacility(row: CampusFacilityRow): CampusFacility {
  return {
    ...row,
    imageSlot:
      row.imageSlot && isSiteImageKey(row.imageSlot) ? row.imageSlot : null,
  };
}

export async function getCampusFacilities() {
  try {
    const { rows } = await query<CampusFacilityRow>(
      `select ${FACILITY_FIELDS}
       from campus_facilities
       where published = true
       order by sort_order asc, title asc`,
    );
    return rows.map(mapFacility);
  } catch (error) {
    if (isMissingFacilitiesTable(error)) {
      console.warn(
        "Campus facilities are using starter entries. Apply backend/supabase/migrations/006_campus_facilities.sql to enable admin management.",
      );
    } else {
      console.error("Unable to load campus facilities:", error);
    }
    return CAMPUS_STARTER_FACILITIES;
  }
}
