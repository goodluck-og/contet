import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import TimeSlot from "@/models/TimeSlot";

export async function POST(req: NextRequest) {
  await connectDB();
  const { postIds } = await req.json();

  if (!Array.isArray(postIds) || postIds.length === 0) {
    return NextResponse.json({ error: "postIds array required" }, { status: 400 });
  }

  const posts = await Post.find({ _id: { $in: postIds } });
  const updated = [];

  for (const post of posts) {
    const slot = await TimeSlot.findOne({
      accountId: post.accountId,
      status: { $in: ["candidate", "locked"] },
    }).sort({ hour: 1 });

    post.approved = true;
    post.status = "queued";
    post.slotId = slot?._id;
    await post.save();
    updated.push(post);
  }

  return NextResponse.json({ updated: updated.length, posts: updated });
}
