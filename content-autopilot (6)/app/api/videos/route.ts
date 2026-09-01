import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";

export async function GET(req: NextRequest) {
  await connectDB();
  const accountId = req.nextUrl.searchParams.get("accountId");
  const status = req.nextUrl.searchParams.get("status");
  const sortBy = req.nextUrl.searchParams.get("sortBy") || "newest"; // newest | views | engagement

  const query: Record<string, string> = {};
  if (accountId) query.accountId = accountId;
  if (status) query.status = status;

  let sort: Record<string, 1 | -1> = { createdAt: -1 };
  if (sortBy === "views") sort = { views24h: -1 };
  if (sortBy === "engagement") sort = { engagementScore: -1 };

  const posts = await Post.find(query).sort(sort).limit(100).lean();
  return NextResponse.json({ posts });
}
