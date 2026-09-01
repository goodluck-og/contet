import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import Account from "@/models/Account";
import { seedDefaultSlots } from "@/lib/seedSlots";

export async function GET() {
  await connectDB();
  const accounts = await Account.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ accounts });
}

export async function POST(req: NextRequest) {
  await connectDB();
  const { name, niche, timezone } = await req.json();

  const account = await Account.create({ name, niche, timezone });
  await seedDefaultSlots(account._id.toString());

  return NextResponse.json({ account });
}
