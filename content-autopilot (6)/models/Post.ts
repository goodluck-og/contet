import { Schema, models, model } from "mongoose";

const PostSchema = new Schema(
  {
    accountId: { type: String, required: true, index: true },
    driveFileId: { type: String, required: true },
    driveFileName: { type: String },
    platform: { type: String, enum: ["tiktok", "youtube", "instagram"], required: true },

    // if a single upload was split into multiple clips, links back to source
    sourceDriveFileId: { type: String },
    clipStartSeconds: { type: Number },
    clipEndSeconds: { type: Number },

    // AI generated content (base version - platform variants below)
    caption: { type: String },
    hashtags: [{ type: String }],
    detectedCharacter: { type: String },
    detectedSource: { type: String }, // e.g. "Genshin Impact"
    approved: { type: Boolean, default: false },

    // per-platform caption tuning (TikTok = punchy, YouTube = keyword-rich, IG = concise)
    captionVariants: {
      tiktok: { type: String },
      youtube: { type: String },
      instagram: { type: String },
    },

    // AI-picked cover frame (base64 thumbnail or storage URL)
    coverFrameUrl: { type: String },

    // duplicate detection
    contentHash: { type: String, index: true },
    possibleDuplicateOf: { type: Schema.Types.ObjectId, ref: "Post" },

    // repost/watermark risk - real cause of FYP suppression, not a workaround
    repostRiskLevel: { type: String, enum: ["none", "warning", "high"], default: "none" },
    repostRiskReasons: [{ type: String }],
    watermarkDetected: { type: Boolean, default: false },

    // series/part numbering, like "Post 25:" seen in TikTok Studio
    partNumber: { type: Number },
    seriesLabel: { type: String }, // snapshot of the label used, e.g. "Post" or "Part"

    // optional thumbnail (real frame selection, not AI-generated - see lib/thumbnail.ts)
    customThumbnailUrl: { type: String },

    // creator controls
    doNotPost: { type: Boolean, default: false }, // draft-only, never enters pipeline

    // Scheduling
    slotId: { type: Schema.Types.ObjectId, ref: "TimeSlot" },
    scheduledFor: { type: Date },
    status: {
      type: String,
      enum: ["draft", "pending_review", "queued", "posted", "failed"],
      default: "pending_review",
    },
    postedAt: { type: Date },
    platformPostId: { type: String }, // id returned by TikTok/YouTube after posting

    // Performance (pulled after posting)
    views24h: { type: Number, default: 0 },
    views7d: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 }, // 0-1
    engagementScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default models.Post || model("Post", PostSchema);
