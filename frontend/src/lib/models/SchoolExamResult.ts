
import mongoose, { Schema, type Model } from "mongoose";

const SubjectSchema = new Schema(
  {
    subject: { type: String, required: true, trim: true },
    maxMarks: { type: Number, required: true, min: 0 },
    marksObtained: { type: Number, required: true, min: 0 },
    grade: { type: String, default: "" },
    remarks: { type: String, default: "" },
    resultStatus: {
      type: String,
      enum: ["Pass", "Fail"],
      default: "Pass",
    },
  },
  { _id: false }
);

const SchoolExamResultSchema = new Schema(
  {
    academicYear: { type: String, required: true, index: true },
    className: { type: String, required: true, index: true },
    examinationKey: { type: String, required: true, index: true },
    examinationName: { type: String, required: true },

    rollNumber: { type: String, required: true, trim: true, index: true },
    studentName: { type: String, required: true, trim: true },

    subjects: { type: [SubjectSchema], required: true },

    totalMarks: { type: Number, required: true },
    maximumMarks: { type: Number, required: true },
    percentage: { type: Number, required: true },

    automaticGrade: { type: String, default: "" },
    manualGrade: { type: String, default: "" },
    finalGrade: { type: String, default: "" },

    resultStatus: {
      type: String,
      enum: ["Pass", "Fail", "Needs Improvement"],
      required: true,
    },

    published: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, default: null },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createdBy: { type: String, default: "" },
  },
  { collection: "school_exam_results" }
);

SchoolExamResultSchema.index(
  {
    academicYear: 1,
    className: 1,
    examinationKey: 1,
    rollNumber: 1,
  },
  { unique: true }
);

const SchoolExamResult: Model<any> =
  mongoose.models.SchoolExamResult ||
  mongoose.model("SchoolExamResult", SchoolExamResultSchema);

export default SchoolExamResult;
