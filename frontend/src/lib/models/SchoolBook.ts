import mongoose, { Schema, type Model } from "mongoose";

export type SchoolBookDocument = {
  title: string;
  author: string;
  subject: string;
  className: string;
  publisher: string;
  academicYear: string;
  price?: number;
  published: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

const SchoolBookSchema = new Schema<SchoolBookDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    author: { type: String, required: true, trim: true, maxlength: 160 },
    subject: { type: String, required: true, trim: true, maxlength: 100 },
    className: { type: String, required: true, trim: true, maxlength: 40, index: true },
    publisher: { type: String, required: true, trim: true, maxlength: 160 },
    academicYear: {
      type: String, required: true, trim: true,
      match: /^\d{4}-\d{2}$/,
      index: true,
    },
    price: { type: Number, min: 0, default: null },
    published: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, collection: "school_books" }
);

SchoolBookSchema.index({ published: 1, className: 1, academicYear: 1, subject: 1 });

const SchoolBook: Model<SchoolBookDocument> =
  mongoose.models.SchoolBook ||
  mongoose.model<SchoolBookDocument>("SchoolBook", SchoolBookSchema);

export default SchoolBook;
