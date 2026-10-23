
import mongoose, { Schema, type Model } from "mongoose";

export interface INotice {
  title: string;
  description: string;
  date: string;
  pdfUrl?: string;
  published: boolean;
  isLatest: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NoticeSchema = new Schema<INotice>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    date: {
      type: String,
      required: true,
    },
    pdfUrl: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2048,
    },
    published: {
      type: Boolean,
      default: false,
    },
    isLatest: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "notices",
  }
);

const Notice: Model<INotice> =
  (mongoose.models.Notice as Model<INotice>) ||
  mongoose.model<INotice>("Notice", NoticeSchema);

export default Notice;
