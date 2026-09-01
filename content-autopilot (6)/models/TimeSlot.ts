import { Schema, models, model } from "mongoose";

const TimeSlotSchema = new Schema(
  {
    accountId: { type: String, required: true, index: true },
    hour: { type: Number, required: true }, // 0-23, in account's local timezone
    minute: { type: Number, required: true }, // 0-59
    status: {
      type: String,
      enum: ["candidate", "locked", "retired"],
      default: "candidate",
    },
    // rolling aggregated performance
    avgEngagementScore: { type: Number, default: 0 },
    postCount: { type: Number, default: 0 },
    variance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default models.TimeSlot || model("TimeSlot", TimeSlotSchema);
