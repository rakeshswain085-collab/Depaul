
import { NextResponse } from "next/server";
import { query } from "@/lib/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StaffRow = {
  id: string;
  name: string;
  designation: string;
  subject: string;
  category: string;
  photoPath: string | null;
  published: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

function getPhotoUrl(path: string | null) {
  if (!path) return "";
  const baseUrl = process.env.SUPABASE_URL;
  if (!baseUrl) throw new Error("SUPABASE_URL is missing from the server environment.");

  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${baseUrl.replace(/\/$/, "")}/storage/v1/object/public/staff-photos/${encodedPath}`;
}

export async function GET() {
  try {
    const { rows: docs } = await query<StaffRow>(
      `select id, name, designation, subject, category, photo_path as "photoPath",
        published, sort_order as "sortOrder", created_at as "createdAt",
        updated_at as "updatedAt"
       from school_staff
       where published = true
       order by category, sort_order, name`,
    );

    return NextResponse.json({
      success: true,
      staff: docs.map((doc) => ({
        _id: doc.id,
        name: doc.name,
        designation: doc.designation,
        subject: doc.subject,
        category: doc.category,
        photoId: doc.photoPath ?? "",
        photoUrl: getPhotoUrl(doc.photoPath),
        published: doc.published,
        sortOrder: doc.sortOrder,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/staff/public:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load published teacher profiles.",
      },
      { status: 500 }
    );
  }
}