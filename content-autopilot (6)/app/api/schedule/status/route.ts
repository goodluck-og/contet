import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import ScheduleState from "@/models/ScheduleState";

export async function GET(req: NextRequest) {
  await connectDB();
  const accountId = req.nextUrl.searchParams.get("accountId");
  if (!accountId) return NextResponse.json({ error: "accountId required" }, { status: 400 });

  const state = await ScheduleState.findOne({ accountId }).lean();
  if (!state) {
    return NextResponse.json({ mode: "not_started" });
  }

  const now = Date.now();
  const start = state.cycleStartDate ? new Date(state.cycleStartDate).getTime() : now;
  const end = state.cycleEndDate ? new Date(state.cycleEndDate).getTime() : now;
  const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  const daysElapsed = Math.min(totalDays, Math.max(0, Math.round((now - start) / (1000 * 60 * 60 * 24))));

  return NextResponse.json({
    mode: state.mode,
    daysElapsed,
    totalDays,
    lockedSlotIds: state.lockedSlotIds,
  });
}
