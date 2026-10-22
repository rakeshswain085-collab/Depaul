import { getDisclosureDatabase } from "@/lib/mandatory-disclosure";

export const EXAM_RESULTS_COLLECTION = "school_exam_results";

export type ExamResultSubject = {
  subject: string;
  maxMarks: number;
  marksObtained: number | string;
  grade?: string;
  remarks?: string;
};

export type ExamResultRecord = {
  academicYear: string;
  className: string;
  examinationName: string;
  examinationKey: string;
  rollNumber: string;
  studentName: string;
  subjects: ExamResultSubject[];
  totalMarks: number;
  maximumMarks: number;
  percentage: number;
  resultStatus: string;
  published: boolean;
  publishedAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export async function getExamResultsCollection() {
  const db = await getDisclosureDatabase();
  return db.collection<ExamResultRecord>(EXAM_RESULTS_COLLECTION);
}

export function toPublicExamResult(doc: ExamResultRecord) {
  return {
    academicYear: doc.academicYear,
    className: doc.className,
    examinationName: doc.examinationName,
    rollNumber: doc.rollNumber,
    studentName: doc.studentName,
    subjects: Array.isArray(doc.subjects) ? doc.subjects : [],
    totalMarks: doc.totalMarks,
    maximumMarks: doc.maximumMarks,
    percentage: doc.percentage,
    resultStatus: doc.resultStatus,
    publishedAt: doc.publishedAt ?? null,
  };
}
