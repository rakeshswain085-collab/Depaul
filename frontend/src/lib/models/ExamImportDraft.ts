
import mongoose, { Schema, type Model } from "mongoose";

const ExamImportDraftSchema = new Schema(
  {
    adminId: {
      type: String,
      required: true,
      index: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
    className: {
      type: String,
      required: true,
    },
    examinationKey: {
      type: String,
      required: true,
    },
    examinationName: {
      type: String,
      required: true,
    },
    students: {
      type: [Schema.Types.Mixed],
      required: true,
    },
    existingRollNumbers: {
      type: [String],
      default: [],
    },
    removedRollNumbers: {
      type: [String],
      default: [],
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      index: { expires: 0 },
    },
  },
  { timestamps: true, collection: "exam_import_drafts" }
);

const ExamImportDraft: Model<any> =
  mongoose.models.ExamImportDraft ||
  mongoose.model("ExamImportDraft", ExamImportDraftSchema);

export default ExamImportDraft;
