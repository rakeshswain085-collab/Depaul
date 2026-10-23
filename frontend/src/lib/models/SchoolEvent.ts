import mongoose, { Schema, type Model } from "mongoose";

export type SchoolEventDocument = {
  title: string;
  description: string;
  eventDate: Date;
  venue: string;
  imageUrl?: string;
  status: "Upcoming" | "Completed";
  published: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

const SchoolEventSchema = new Schema<SchoolEventDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    eventDate: { type: Date, required: true },
    venue: { type: String, required: true, trim: true, maxlength: 250 },
    imageUrl: { type: String, trim: true, maxlength: 1000, default: "" },
    status: {
      type: String,
      enum: ["Upcoming", "Completed"],
      default: "Upcoming",
      required: true,
    },
    published: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, collection: "school_events" }
);

SchoolEventSchema.index({ published: 1, eventDate: 1 });

const SchoolEvent: Model<SchoolEventDocument> =
  mongoose.models.SchoolEvent ||
  mongoose.model<SchoolEventDocument>("SchoolEvent", SchoolEventSchema);

export default SchoolEvent;
