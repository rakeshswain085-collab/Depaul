import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DisclosureRow = {
  id: string;
  title: string;
  category: string;
  description: string;
  academicYear: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  createdAt: string;
};

export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get("category")?.trim();
    const values: string[] = [];
    let categoryFilter = "";

    if (category) {
      values.push(category);
      categoryFilter = " and category = $1";
    }

    const { rows } = await query<DisclosureRow>(
      `select id, title, category, description,
              academic_year as "academicYear", file_name as "fileName",
              file_size as "fileSize", content_type as "contentType",
              created_at as "createdAt"
       from mandatory_disclosures
       where published = true${categoryFilter}
       order by category asc, title asc, created_at desc`,
      values,
    );

    return NextResponse.json(
      {
        success: true,
        data: rows.map((row) => ({
          ...row,
          fileUrl: `/api/mandatory-disclosure/file/${encodeURIComponent(row.id)}`,
          published: true,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Public disclosure GET failed:", error);
    return NextResponse.json(
      { success: false, message: "Unable to load published disclosures." },
      { status: 500 },
    );
  }
}
