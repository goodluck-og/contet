import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import TimeSlot from "@/models/TimeSlot";

// Phase 1: approving a post just marks it approved + queued.
// It does NOT call the TikTok/YouTube API yet - that gets wired in once
// TikTok Content Posting API approval comes through (see notes in chat).
// A cron job (Vercel Cron or a Render worker) will later pick up "queued"
// posts whose scheduledFor time has passed and actually publish them.

export async function POST(req: NextRequest) {
  await connectDB();
  const { postId, editedCaption } = await req.json();

  const post = await Post.findById(postId);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  // pick the next open candidate/locked slot for this account, today or next available day
  const slot = await TimeSlot.findOne({
    accountId: post.accountId,
    status: { $in: ["candidate", "locked"] },
  }).sort({ hour: 1 });

  if (editedCaption) post.caption = editedCaption;
  post.approved = true;
  post.status = "queued";
  post.slotId = slot?._id;

  await post.save();

  return NextResponse.json({ post });
}
