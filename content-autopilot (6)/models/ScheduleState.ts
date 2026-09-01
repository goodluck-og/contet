import { Schema, models, model } from "mongoose";

const ScheduleStateSchema = new Schema(
  {
    accountId: { type: String, required: true, unique: true },
    mode: { type: String, enum: ["exploring", "locked"], default: "exploring" },
    cycleStartDate: { type: Date, default: Date.now },
    cycleEndDate: { type: Date }, // cycleStartDate + 30 days
    lockedSlotIds: [{ type: Schema.Types.ObjectId, ref: "TimeSlot" }],
    lastRelearnTriggerReason: { type: String },
    postsPerDay: { type: Number, default: 3 },
  },
  { timestamps: true }
);

export default models.ScheduleState || model("ScheduleState", ScheduleStateSchema);
