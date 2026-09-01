import { google } from "googleapis";
import { getAuthenticatedClient } from "@/lib/googleAuth";
import fs from "fs";
import os from "os";
import path from "path";

/**
 * Lists video files in the connected Drive folder that haven't been
 * processed into a Post yet. Called by the Drive webhook / a polling
 * job as the entry point of the whole pipeline.
 */
export async function listNewDriveVideos(googleTokens: Record<string, unknown>, folderId: string) {
  const authClient = getAuthenticatedClient(googleTokens);
  const drive = google.drive({ version: "v3", auth: authClient });

  const res = await drive.files.list({
    q: `'${folderId}' in parents and mimeType contains 'video/' and trashed = false`,
    fields: "files(id, name, createdTime, mimeType)",
    orderBy: "createdTime desc",
  });

  return res.data.files || [];
}

/**
 * Downloads a Drive file to a temp path on disk so it can be uploaded
 * to YouTube (or passed to ffmpeg for frame extraction).
 */
export async function downloadDriveFile(googleTokens: Record<string, unknown>, fileId: string) {
  const authClient = getAuthenticatedClient(googleTokens);
  const drive = google.drive({ version: "v3", auth: authClient });

  const destPath = path.join(os.tmpdir(), `${fileId}.mp4`);
  const dest = fs.createWriteStream(destPath);

  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" }
  );

  await new Promise<void>((resolve, reject) => {
    res.data
      .on("end", () => resolve())
      .on("error", (err: Error) => reject(err))
      .pipe(dest);
  });

  return destPath;
}
