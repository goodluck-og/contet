import { google } from "googleapis";

// One OAuth app, two scopes: read the Drive folder for new clips,
// upload to YouTube. This is why we only need ONE Google connect step
// instead of separate Drive and YouTube auth flows.
const SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/userinfo.email",
];

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(accountId: string) {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline", // needed to get a refresh_token
    prompt: "consent", // forces refresh_token on repeat connects too
    scope: SCOPES,
    state: accountId, // so the callback knows which Account to attach tokens to
  });
}

export async function exchangeCodeForTokens(code: string) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

export function getAuthenticatedClient(googleTokens: Record<string, unknown>) {
  const client = getOAuthClient();
  client.setCredentials(googleTokens);
  return client;
}
