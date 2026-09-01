import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import { exchangeCodeForTokens, getAuthenticatedClient } from "@/lib/googleAuth";
import { seedDefaultSlots } from "@/lib/seedSlots";
import Account from "@/models/Account";
import { google } from "googleapis";

export async function GET(req: NextRequest) {
  await connectDB();

  const code = req.nextUrl.searchParams.get("code");
  const accountId = req.nextUrl.searchParams.get("state"); // set when we built the auth URL

  if (!code || !accountId) {
    return NextResponse.json({ error: "Missing code or account reference" }, { status: 400 });
  }

  const tokens = await exchangeCodeForTokens(code);

  // fetch the connected Google email + YouTube channel id right away,
  // so the dashboard can show "Connected as you@gmail.com"
  const authClient = getAuthenticatedClient(tokens as Record<string, unknown>);
  const oauth2 = google.oauth2({ version: "v2", auth: authClient });
  const { data: userInfo } = await oauth2.userinfo.get();

  const youtube = google.youtube({ version: "v3", auth: authClient });
  const { data: channelData } = await youtube.channels.list({
    part: ["id"],
    mine: true,
  });
  const youtubeChannelId = channelData.items?.[0]?.id;

  const account = await Account.findByIdAndUpdate(
    accountId,
    {
      googleTokens: tokens,
      googleConnectedEmail: userInfo.email,
      youtubeChannelId,
    },
    { new: true }
  );

  if (account) {
    await seedDefaultSlots(account._id.toString());
  }

  // redirect back to the dashboard with a success flag
  const dashboardUrl = new URL("/dashboard", req.nextUrl.origin);
  dashboardUrl.searchParams.set("connected", "google");
  return NextResponse.redirect(dashboardUrl);
}
