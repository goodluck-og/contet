import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import TimeSlot from "@/models/TimeSlot";
import Account from "@/models/Account";
import { generateText } from "@/lib/gemini";
import { compareToNicheBenchmark } from "@/lib/nicheBenchmark";

// Generates a short, plain-language weekly summary from the last 7 days
// of posted content: which content types/times are outperforming, using
// the account's own data - not external trend claims.
export async function GET(req: NextRequest) {
  await connectDB();
  const accountId = req.nextUrl.searchParams.get("accountId");
  if (!accountId) return NextResponse.json({ error: "accountId required" }, { status: 400 });

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const posts = await Post.find({
    accountId,
    status: "posted",
    postedAt: { $gte: sevenDaysAgo },
  }).lean();

  if (posts.length === 0) {
    return NextResponse.json({
      digest: "No posted videos in the last 7 days yet - the digest will populate once posting is live.",
      postCount: 0,
    });
  }

  const slots = await TimeSlot.find({ accountId }).lean();

  const summaryInput = posts.map((p) => ({
    postedAt: p.postedAt,
    engagementScore: p.engagementScore,
    detectedCharacter: p.detectedCharacter,
    slotId: p.slotId,
  }));

  const digest = await generateText(
    `Given this week's post performance data: ${JSON.stringify(
      summaryInput
    )} and time slots: ${JSON.stringify(
      slots
    )}, write a short (3-4 sentence) plain-language digest for a content creator, highlighting what content or timing performed best this week. No headers, just a short paragraph.`
  );

  const account = await Account.findById(accountId).lean();
  const avgRate =
    posts.reduce((sum, p) => sum + (p.engagementScore || 0), 0) / posts.length;
  const benchmark = compareToNicheBenchmark(avgRate, account?.niche || "");

  return NextResponse.json({ digest, postCount: posts.length, benchmark });
}
