import { NextResponse } from "next/server";
import { query } from "@/lib/database";
import { publicStorageUrl } from "@/lib/storage";
import {
  DEFAULT_SITE_IMAGES,
  isSiteImageKey,
  type SiteImageKey,
} from "@/lib/site-images";

export const dynamic = "force-dynamic";

type SiteImageRow = {
  slot: string;
  storagePath: string;
};

export async function GET() {
  try {
    const { rows } = await query<SiteImageRow>(
      `select slot, storage_path as "storagePath" from website_images`,
    );
    const images: Record<SiteImageKey, string> = { ...DEFAULT_SITE_IMAGES };

    for (const row of rows) {
      if (isSiteImageKey(row.slot) && row.storagePath) {
        images[row.slot] = publicStorageUrl("site-images", row.storagePath);
      }
    }

    return NextResponse.json(
      { success: true, images },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Website images GET failed:", error);
    return NextResponse.json(
      {
        success: true,
        images: DEFAULT_SITE_IMAGES,
        usingDefaults: true,
        warning: "Saved website images are unavailable; showing the default images.",
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
