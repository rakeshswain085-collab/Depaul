
import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";
import { connectDB } from "../../database/mongodb";

export const DISCLOSURE_COLLECTION = "mandatory_disclosures";
export const DISCLOSURE_CONTENT_COLLECTION =
  "mandatory_disclosure_content";
export const DISCLOSURE_BUCKET = "mandatoryDisclosureFiles";
export const MAX_DISCLOSURE_FILE_SIZE = 10 * 1024 * 1024;

export const DISCLOSURE_CATEGORIES = [
  "General Information",
  "Documents & Certifications",
  "Results & Academics",
  "Staff Information",
  "School Infrastructure",
  "Campus Inspection",
] as const;

export type DisclosureCategory =
  (typeof DISCLOSURE_CATEGORIES)[number];

export type MandatoryDisclosure = {
  _id: string;
  title: string;
  category: string;
  description: string;
  academicYear: string;
  fileId: string;
  fileName: string;
  contentType: "application/pdf";
  fileSize: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  fileUrl: string;
};

export type DisclosureField = {
  label: string;
  value: string;
};

export type DisclosureDocument = {
  title: string;
  description: string;
  fileId: string;
  fileName: string;
  published: boolean;
  academicYear?: string;
};

export type DisclosureContent = {
  generalInformation: {
    title: string;
    description: string;
    fields: DisclosureField[];
  };

  documentsAndCertifications: {
    title: string;
    description: string;
    groups: {
      title: string;
      documents: DisclosureDocument[];
    }[];
  };

  resultsAndAcademics: {
    title: string;
    description: string;
    records: DisclosureDocument[];
  };

  staffInformation: {
    title: string;
    description: string;
    pgtTeachers: number;
    tgtTeachers: number;
    prtTeachers: number;
    principal: string;
    teacherStudentRatio: string;
    specialEducator: string;
    counsellor: string;
  };

  schoolInfrastructure: {
    title: string;
    description: string;
    campusArea: string;
    classrooms: number;
    classroomSize: string;
    scienceLabSize: string;
    computerLabSize: string;
    mathematicsLabSize: string;
    internetFacility: boolean;
    girlsToilets: number;
    boysToilets: number;
  };

  campusInspection: {
    title: string;
    description: string;
    videoUrl: string;
    published: boolean;
  };

  updatedAt?: Date;
};

export async function getDisclosureDatabase() {
  await connectDB();

  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB connection is not ready.");
  }

  return db;
}

export async function getDisclosureBucket() {
  const db = await getDisclosureDatabase();

  return new GridFSBucket(db, {
    bucketName: DISCLOSURE_BUCKET,
  });
}

export function isValidObjectId(value: string): boolean {
  return /^[a-f\d]{24}$/i.test(value);
}

function toStringValue(
  value: unknown,
  fallback = ""
): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value);
}

function toISOString(value: unknown): string {
  if (
    value instanceof Date &&
    !Number.isNaN(value.getTime())
  ) {
    return value.toISOString();
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  return new Date().toISOString();
}

export function toDisclosureResponse(
  doc: Record<string, unknown>
): MandatoryDisclosure {
  const rawId = doc._id;
  const rawFileId = doc.fileId;

  const id =
    rawId instanceof ObjectId
      ? rawId.toHexString()
      : toStringValue(rawId);

  const fileId =
    rawFileId instanceof ObjectId
      ? rawFileId.toHexString()
      : toStringValue(rawFileId);

  return {
    _id: id,
    title: toStringValue(doc.title),
    category: toStringValue(
      doc.category,
      "General Documents"
    ),
    description: toStringValue(doc.description),
    academicYear: toStringValue(doc.academicYear),
    fileId,
    fileName: toStringValue(doc.fileName),
    contentType: "application/pdf",
    fileSize: Number(doc.fileSize ?? 0),
    published: doc.published === true,
    createdAt: toISOString(doc.createdAt),
    updatedAt: toISOString(doc.updatedAt),
    fileUrl: fileId
      ? `/api/mandatory-disclosure/file/${fileId}`
      : "",
  };
}
