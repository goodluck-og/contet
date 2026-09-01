import crypto from "crypto";
import Post from "@/models/Post";

/**
 * Simple content fingerprint from the extracted frame, used to catch
 * accidental re-uploads of the same clip. Not a true perceptual hash
 * (that would need a library like `sharp` + pHash), but catches exact
 * or near-exact re-uploads cheaply. Upgrade path noted below.
 */
export function fingerprintFrame(frameBase64: string) {
  return crypto.createHash("sha256").update(frameBase64).digest("hex");
}

/**
 * Checks recent posts for the same account for a matching fingerprint.
 * Returns the matching Post if found, else null.
 *
 * TODO upgrade: swap sha256 exact-match for a perceptual hash (pHash/dHash)
 * so near-duplicate frames (slightly re-cropped/re-encoded clips) are also
 * caught, not just byte-identical ones.
 */
export async function findPossibleDuplicate(accountId: string, contentHash: string) {
  const match = await Post.findOne({ accountId, contentHash }).sort({ createdAt: -1 });
  return match;
}
