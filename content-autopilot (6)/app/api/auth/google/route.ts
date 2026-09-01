import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getAuthUrl } from "@/lib/googleAuth";

export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("accountId");
  if (!accountId) {
    return NextResponse.json({ error: "accountId query param required" }, { status: 400 });
  }

  const url = getAuthUrl(accountId);
  return NextResponse.redirect(url);
}
