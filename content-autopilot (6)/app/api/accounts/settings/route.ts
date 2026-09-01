import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import Account from "@/models/Account";

export async function PATCH(req: NextRequest) {
  await connectDB();
  const { accountId, themeId, useSeriesNumbering, seriesLabel, autoSelectThumbnail } =
    await req.json();

  if (!accountId) {
    return NextResponse.json({ error: "accountId required" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (themeId !== undefined) update.themeId = themeId;
  if (useSeriesNumbering !== undefined) update.useSeriesNumbering = useSeriesNumbering;
  if (seriesLabel !== undefined) update.seriesLabel = seriesLabel;
  if (autoSelectThumbnail !== undefined) update.autoSelectThumbnail = autoSelectThumbnail;

  const account = await Account.findByIdAndUpdate(accountId, update, { new: true });
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  return NextResponse.json({ account });
}
