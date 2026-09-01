import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import { generateCaption } from "@/lib/gemini";
import { fingerprintFrame, findPossibleDuplicate } from "@/lib/duplicateDetection";
import { checkRepostRisk } from "@/lib/repostRisk";
import Account from "@/models/Account";
import Post from "@/models/Post";

export async function POST(req: NextRequest) {
  await connectDB();
  const { accountId, driveFileId, driveFileName, frameBase64, platform } = await req.json();

  if (!accountId || !frameBase64) {
    return NextResponse.json({ error: "accountId and frameBase64 are required" }, { status: 400 });
  }

  const account = await Account.findById(accountId);
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const contentHash = fingerprintFrame(frameBase64);
  const duplicate = await findPossibleDuplicate(accountId, contentHash);

  const result = await generateCaption({ frameBase64, niche: account.niche || "" });
  const targetPlatform = platform || "tiktok";

  const repostRisk = checkRepostRisk({
    driveFileName,
    isDuplicateOfExisting: Boolean(duplicate),
  });

  if (result.watermarkDetected && repostRisk.level === "none") {
    repostRisk.level = "warning";
    repostRisk.reasons.push(result.watermarkNote || "AI detected a possible watermark in the frame.");
  }

  // Series/part numbering - e.g. "Post 25: ..." like in your TikTok Studio.
  // Only applied if the account has it turned on in settings.
  let partNumber: number | undefined;
  let seriesLabel: string | undefined;
  let finalCaption = result.captionVariants?.[targetPlatform] || result.caption;

  if (account.useSeriesNumbering) {
    account.postNumberCounter = (account.postNumberCounter || 0) + 1;
    await account.save();
    partNumber = account.postNumberCounter;
    seriesLabel = account.seriesLabel || "Post";
    finalCaption = `${seriesLabel} ${partNumber}: ${finalCaption}`;
  }

  const post = await Post.create({
    accountId,
    driveFileId,
    driveFileName,
    platform: targetPlatform,
    caption: finalCaption,
    captionVariants: result.captionVariants,
    hashtags: result.hashtags,
    detectedCharacter: result.character,
    detectedSource: result.source,
    coverFrameUrl: `data:image/jpeg;base64,${frameBase64}`,
    contentHash,
    possibleDuplicateOf: duplicate?._id,
    repostRiskLevel: repostRisk.level,
    repostRiskReasons: repostRisk.reasons,
    watermarkDetected: Boolean(result.watermarkDetected),
    partNumber,
    seriesLabel,
    status: "pending_review",
  });

  return NextResponse.json({
    post,
    duplicateWarning: duplicate
      ? `This looks similar to a clip posted on ${duplicate.postedAt || duplicate.createdAt}.`
      : null,
  });
}
