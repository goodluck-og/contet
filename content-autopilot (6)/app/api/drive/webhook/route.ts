import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

// This is a stub for Google Drive push notifications.
// Once you have Drive API credentials (see .env.example), this route
// receives a "watch" notification whenever a new file lands in the
// connected folder. You'll then:
//   1. Fetch the file via the Drive API
//   2. Extract a frame (e.g. using ffmpeg, ideally on a background worker
//      since Vercel serverless functions have execution time limits)
//   3. POST that frame + accountId to /api/caption/generate
//   4. The resulting Post record shows up in the dashboard for approval
//
// Google Drive push notifications only tell you "something changed" -
// you then have to call files.list with the pageToken to find out what.
// See: https://developers.google.com/drive/api/guides/push

export async function POST(req: NextRequest) {
  const channelId = req.headers.get("x-goog-channel-id");
  const resourceState = req.headers.get("x-goog-resource-state");

  // TODO: look up which account this channelId belongs to,
  // then fetch changed files via Drive API using account.driveTokens

  console.log("Drive webhook received:", { channelId, resourceState });

  return NextResponse.json({ received: true });
}
