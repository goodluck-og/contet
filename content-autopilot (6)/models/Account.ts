import { Schema, models, model } from "mongoose";

const AccountSchema = new Schema(
  {
    name: { type: String, required: true },
    niche: { type: String },
    timezone: { type: String, default: "Africa/Lagos" },

    googleTokens: { type: Schema.Types.Mixed },
    driveFolderId: { type: String },
    youtubeChannelId: { type: String },
    googleConnectedEmail: { type: String },

    tiktokTokens: { type: Schema.Types.Mixed },
    tiktokUsername: { type: String },

    postsPerDayCap: { type: Number, default: 3 },

    // Dashboard theme
    themeId: { type: String, default: "original" },

    // Post numbering (like "Post 25:" or "Part 1:" seen in TikTok Studio)
    useSeriesNumbering: { type: Boolean, default: false },
    seriesLabel: { type: String, default: "Post" }, // "Post", "Part", or custom
    postNumberCounter: { type: Number, default: 0 },

    // Optional thumbnail selection for YouTube (uses best extracted frame,
    // not AI-generated - see lib/thumbnail.ts for the honest explanation)
    autoSelectThumbnail: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default models.Account || model("Account", AccountSchema);
