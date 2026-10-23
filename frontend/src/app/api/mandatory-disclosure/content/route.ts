
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";
import { getCurrentAdmin } from "@/lib/auth";
import { DISCLOSURE_CATEGORIES, type DisclosureContent } from "@/lib/mandatory-disclosure";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTENT_KEY = "main";

const DEFAULT_CONTENT: DisclosureContent = {
  generalInformation: {
    title: "General Information",
    description:
      "Official information about De-Paul Senior Secondary School, Aska.",
    fields: [
      { label: "Name of the School", value: "De-Paul Senior Secondary School, Aska" },
      { label: "Affiliation Number", value: "1530153" },
      { label: "School Code", value: "15344" },
      { label: "Board", value: "Central Board of Secondary Education (CBSE)" },
      { label: "School Category", value: "Senior Secondary (Co-educational)" },
      { label: "Classes Offered", value: "Pre-Nursery to Class XII" },
      { label: "Year of Establishment", value: "2000" },
      { label: "Address", value: "Rankanath Vihar, College Square, Nuagam, Aska, Ganjam, Odisha – 761111" },
      { label: "District / State", value: "Ganjam, Odisha – 761111" },
      { label: "Principal", value: "Ms. Rajani Panda" },
      { label: "Chairman", value: "Mr. Ashok Padhy" },
      { label: "School Email", value: "depaulschoolaska@gmail.com" },
      { label: "School Telephone", value: "+91 94387 67946" },
      { label: "Nature of the School", value: "Private, Unaided" },
      { label: "Type of Management", value: "Society / Trust managed" },
    ],
  },

  documentsAndCertifications: {
    title: "Documents & Certificates",
    description:
      "Access the school's affiliation documents, statutory certificates and other mandatory records.",
    groups: [],
  },

  resultsAndAcademics: {
    title: "Results & Academics",
    description:
      "Academic information, examination results, school fees and committee records.",
    records: [
      { title: "Fee Structure of the School", description: "School fee details", fileId: "", fileName: "", published: false },
      { title: "Annual Academic Calendar", description: "Academic schedule and important dates", fileId: "", fileName: "", published: false },
      { title: "School Management Committee (SMC)", description: "List of committee members", fileId: "", fileName: "", published: false },
      { title: "Parent Teacher Association (PTA)", description: "List of PTA members", fileId: "", fileName: "", published: false },
      { title: "Last Three Years Board Examination Results", description: "CBSE board examination results", fileId: "", fileName: "", published: false },
    ],
  },

  staffInformation: {
    title: "Staff Information",
    description: "Teaching staff, school leadership and student-teacher ratio.",
    pgtTeachers: 6,
    tgtTeachers: 18,
    prtTeachers: 6,
    principal: "Ms. Rajani Panda",
    teacherStudentRatio: "1:21",
    specialEducator: "Ms. Narmada Senapati, TGT",
    counsellor: "Mr. Santosh Kumar Mishra, TGT",
  },

  schoolInfrastructure: {
    title: "School Infrastructure",
    description:
      "Campus area, classrooms, laboratories, sanitation facilities and digital connectivity.",
    campusArea: "8,305",
    classrooms: 19,
    classroomSize: "60.47",
    scienceLabSize: "87.79",
    computerLabSize: "60.47",
    mathematicsLabSize: "46.82",
    internetFacility: true,
    girlsToilets: 12,
    boysToilets: 8,
  },

  campusInspection: {
    title: "Explore Our School Infrastructure",
    description:
      "Watch the school inspection video covering the campus and infrastructure facilities of De-Paul Senior Secondary School.",
    videoUrl: "",
    published: true,
  },

  updatedAt: new Date(),
};

function isObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function validateContent(body: unknown): body is Record<string, unknown> {
  if (!isObject(body)) return false;

  const sections = [
    "generalInformation",
    "documentsAndCertifications",
    "resultsAndAcademics",
    "staffInformation",
    "schoolInfrastructure",
    "campusInspection",
  ];

  return sections.every((section) => isObject(body[section]));
}

export async function GET() {
  try {
    const { rows } = await query<{ payload: DisclosureContent | null }>(
      "select payload from mandatory_disclosure_content where key = $1",
      [CONTENT_KEY],
    );
    const data = rows[0]?.payload ?? DEFAULT_CONTENT;

    if ((data as DisclosureContent & { published?: boolean }).published === false) {
      return NextResponse.json({
        success: true,
        data: null,
        categories: DISCLOSURE_CATEGORIES,
      });
    }

    return NextResponse.json({
      success: true,
      data,
      categories: DISCLOSURE_CATEGORIES,
    });
  } catch (error) {
    console.error("Disclosure content GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load disclosure content.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!(await getCurrentAdmin())) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 },
      );
    }

    const body: unknown = await request.json();

    if (!validateContent(body)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid disclosure content. All six sections are required.",
        },
        { status: 400 }
      );
    }

    const input = body;
    const now = new Date();

    const content = {
      generalInformation: input.generalInformation,
      documentsAndCertifications: input.documentsAndCertifications,
      resultsAndAcademics: input.resultsAndAcademics,
      staffInformation: input.staffInformation,
      schoolInfrastructure: input.schoolInfrastructure,
      campusInspection: input.campusInspection,
    };

    await query(
      `insert into mandatory_disclosure_content (key, payload, created_at, updated_at)
       values ($1, $2::jsonb, $3, $3)
       on conflict (key) do update
       set payload = excluded.payload, updated_at = excluded.updated_at`,
      [CONTENT_KEY, JSON.stringify(content), now],
    );

    return NextResponse.json({
      success: true,
      message: "All six disclosure sections have been saved.",
      data: content,
      updatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Disclosure content PUT error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to save disclosure content.",
      },
      { status: 500 }
    );
  }
}
