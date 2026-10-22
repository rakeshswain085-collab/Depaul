
import { NextRequest, NextResponse } from "next/server";
import {
  DISCLOSURE_CONTENT_COLLECTION,
  DISCLOSURE_CATEGORIES,
  getDisclosureDatabase,
  type DisclosureContent,
} from "@/lib/mandatory-disclosure";

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
    groups: [
      {
        title: "General Documents",
        documents: [
          { title: "Affiliation / Upgradation Letter and Recent Extension of Affiliation", description: "Official school document", fileId: "", fileName: "", published: false },
          { title: "Society / Trust Registration Certificate", description: "Official school document", fileId: "", fileName: "", published: false },
          { title: "No Objection Certificate (NOC)", description: "Official school document", fileId: "", fileName: "", published: false },
          { title: "Recognition Certificate under RTE Act, 2009", description: "Official school document", fileId: "", fileName: "", published: false },
          { title: "Building Safety Certificate", description: "Official school document", fileId: "", fileName: "", published: false },
          { title: "Valid Fire Safety Certificate", description: "Official school document", fileId: "", fileName: "", published: false },
          { title: "DEO Certificate / Self Certification by School", description: "Official school document", fileId: "", fileName: "", published: false },
          { title: "Water, Health and Sanitation Certificates", description: "Official school document", fileId: "", fileName: "", published: false },
        ],
      },
    ],
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

function stripMongoFields(document: Record<string, unknown>) {
  const result = { ...document };
  delete result._id;
  delete result.key;
  return result;
}

export async function GET() {
  try {
    const db = await getDisclosureDatabase();
    const collection = db.collection(DISCLOSURE_CONTENT_COLLECTION);

    let saved = await collection.findOne({ key: CONTENT_KEY });

    // Also support the older document format that used _id: "main".
    if (!saved) {
      saved = await collection.findOne({
        _id: CONTENT_KEY as never,
      });
    }

    if (!saved) {
      const now = new Date();

      await collection.updateOne(
        { key: CONTENT_KEY },
        {
          $setOnInsert: {
            ...DEFAULT_CONTENT,
            key: CONTENT_KEY,
            createdAt: now,
            updatedAt: now,
          },
        },
        { upsert: true }
      );

      saved = await collection.findOne({ key: CONTENT_KEY });
    }

    if (!saved || saved.published === false) {
      return NextResponse.json({
        success: true,
        data: null,
        categories: DISCLOSURE_CATEGORIES,
      });
    }

    const data = stripMongoFields(
      saved as Record<string, unknown>
    );

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
    // IMPORTANT: Verify the current admin session here before allowing writes.
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

    const db = await getDisclosureDatabase();
    const collection = db.collection(DISCLOSURE_CONTENT_COLLECTION);

    await collection.updateOne(
      { key: CONTENT_KEY },
      {
        $set: {
          ...content,
          key: CONTENT_KEY,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true }
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
