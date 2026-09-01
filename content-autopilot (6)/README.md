# Content Autopilot

Drive → AI caption → scheduled posting, with a self-learning posting-time engine.

## What's built (Phase 1 foundation)

- Next.js 14 App Router project, Tailwind, TypeScript
- MongoDB models: `Account`, `Post`, `TimeSlot`, `ScheduleState`
- `lib/anthropic.ts` — sends a video frame to Claude, gets back character/source + SEO caption + hashtags
- `lib/scoring.ts` — weighted engagement score formula
- `lib/scheduleEngine.ts` — the learning engine:
  - `checkForStableBase()` — detects an early winning set of 3 time slots before the 30-day window ends
  - `forceLockBestSlots()` — fallback: picks top 3 slots if no clear winner after 30 days
  - `checkForRelearnTrigger()` — detects when a locked slot's performance drops 25%+ and should restart exploration
  - `startExplorationCycle()` — kicks off a fresh 30-day test
- `lib/seedSlots.ts` — seeds 6 research-based candidate time slots (gaming/anime niche skew) for cold-start accounts
- API routes:
  - `POST /api/caption/generate` — frame in, AI caption out, saves a `Post`
  - `GET /api/videos` — list posts by status
  - `POST /api/post/manual` — approve a caption, assign it to next slot, mark queued
  - `POST /api/drive/webhook` — stub for Google Drive push notifications
- `/dashboard` — approval queue UI + status counts

## What's stubbed / needs your API keys

1. **Google Drive watch + file fetch** — `app/api/drive/webhook/route.ts` has the shape but needs your Google Cloud OAuth credentials and the actual `files.list`/`files.get` calls wired in.
2. **Frame extraction from video** — needs ffmpeg, best run in a background worker (Render) rather than a Vercel serverless function, since video processing can exceed execution time limits.
3. **TikTok posting** — needs TikTok Developer app approval before the Content Posting API will work. Until then, `status: "queued"` posts just sit there — you'd post manually as a bridge.
4. **YouTube upload** — needs Google OAuth consent + Data API upload call.
5. **Cron/scheduler** — a Vercel Cron job (or Render worker) that checks for `queued` posts whose `scheduledFor` time has passed and actually calls the platform APIs.
6. **Performance puller** — a scheduled job that pulls views/likes/shares/completion rate per post 24h and 7d after posting, updates the `Post` and `TimeSlot` aggregates.

## Next build steps (in order)

1. Wire up Google OAuth + Drive folder picker so you can connect your account
2. Build the ffmpeg frame extraction worker
3. Get TikTok Developer app submitted for review (do this early — approval takes time)
4. Wire the cron job for actual posting
5. Wire the performance puller + hook it into `scheduleEngine.ts`

## Setup

```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

## Added since Phase 1

- **Multi-platform support**: `Post.platform` now supports tiktok/youtube/instagram, with `captionVariants` storing a platform-tuned version of each caption (punchy for TikTok, SEO-keyword-rich for YouTube, mood-focused for Instagram)
- **Duplicate detection**: `lib/duplicateDetection.ts` fingerprints each frame and flags likely re-uploads (`possibleDuplicateOf` on the Post). Currently exact-match hashing; upgrade path to perceptual hashing noted in the file.
- **AI cover frame**: `coverFrameUrl` field on Post - wire this to actually pick the best frame, not just the first, once frame extraction is built
- **Bulk approve**: `POST /api/post/bulk-approve` + checkbox UI in the dashboard
- **Draft / do-not-post**: `POST /api/post/toggle-draft` lets you pull a clip out of the pipeline without deleting it
- **Multi-account support**: `GET/POST /api/accounts` - the schema was already account-scoped, this exposes it so one login can manage multiple channels
- **Weekly digest**: `GET /api/digest/weekly?accountId=` - AI-written summary of the account's own last-7-days performance (no external trend claims, just your own data)
- **New color system**: ink (#002626), teal (#0E4749), lime (#95C623), ember (#E55812), cream (#EFE7DA) - added to `tailwind.config.ts`, dashboard fully reskinned

## Still stubbed (needs your API keys / further build)

- Multi-clip batching (splitting one upload into several posts) - not yet built
- Trend-aware hashtags - not yet built, needs a trends data source
- Instagram/YouTube actual posting calls - only TikTok/YouTube/Instagram exist as platform *options* on the Post model so far; the actual upload API calls are still stubs
- Follower growth correlation, competitor benchmark - deferred, need real performance data flowing first

## YouTube-first build (this round)

Since TikTok needs developer app approval and YouTube doesn't, we're getting
YouTube fully working first to prove the pipeline end-to-end.

- **One Google OAuth connects both Drive and YouTube** — `lib/googleAuth.ts` requests
  `drive.readonly` + `youtube.upload` scopes together in a single consent screen.
  Click "Connect Google" on the dashboard to start it.
- `GET /api/auth/google?accountId=` — starts the OAuth flow
- `GET /api/auth/google/callback` — exchanges the code for tokens, saves them to
  the Account, fetches the connected email + YouTube channel id, seeds default
  time slots
- `lib/drive.ts` — lists new video files in the connected Drive folder, downloads
  a file to a temp path for upload
- `lib/youtube.ts` — actually uploads a video to YouTube as a Short (adds
  `#Shorts` automatically so YouTube's system recognizes it)
- `POST /api/post/publish-youtube` — the real publish step: downloads from Drive,
  uploads to YouTube, updates the Post status/result
- `lib/nicheBenchmark.ts` — feature #9 (niche benchmark), built honestly: static
  published industry engagement-rate ranges for context, NOT live competitor
  tracking (that would require paid tools or ToS-breaking scraping). Wired into
  the weekly digest response.
- Weekly digest (#7) now returns a `benchmark` field alongside the AI summary

## Setup addition

Add to your Google Cloud OAuth client's authorized redirect URIs:
`http://localhost:3000/api/auth/google/callback` (and your Vercel URL's
equivalent once deployed).

## Switched to Gemini (free tier)

Replaced Anthropic with Google Gemini for all AI calls, since it's free at
this posting volume (no pay-as-you-go needed).

- `lib/gemini.ts` replaces `lib/anthropic.ts` — same function names/return
  shapes (`generateCaption`, `generateText`) so nothing else needed to change
- Uses `gemini-1.5-flash` — vision + text, free tier ~15 req/min / 1500/day
- Get your key at https://ai.google.dev/ → set as `GEMINI_API_KEY` in `.env.local`

## Cooler feel + real reach-risk protection (this round)

- **Thumbnails** — pending review cards now show the actual extracted frame
- **Toast notifications** — a small confirmation slides in on approve/queue/draft actions
- **Exploration progress ring** — circular "Day 12/30" indicator on the dashboard showing
  where the account is in its learning cycle (`components/CycleProgressRing.tsx`,
  `GET /api/schedule/status`)
- **Card animations** — approved clips animate out smoothly (Framer Motion)
- **Live pulse dot** — the "Queued" stat pulses when there's something waiting to post

### Repost-risk / reach-suppression check (`lib/repostRisk.ts`)

Built this instead of any "trick TikTok" workaround, because watermarks and
reposted content are a REAL, common cause of FYP suppression - not something
a workaround fixes. The pipeline now:
- Flags filenames suggesting the clip was exported from another app (CapCut,
  downloader sites) or re-shared, since that usually means an embedded watermark
- Flags likely duplicate/reposted content using the existing fingerprint check
- Asks Gemini directly, in the same caption-generation call, whether it can see
  a visible watermark/logo in the frame
- Shows a clear warning badge on the pending-review card so you catch it before
  posting, instead of finding out from low views afterward

This won't "make TikTok recommend more" by itself - it just stops the most common
self-inflicted causes of suppression before they go out.

## This round: themes, series numbering, Manage view, thumbnail toggle

### #1 Theme switcher
- `lib/themes.ts` — 7 palettes (your "Original Ink" plus 6 pulled from the
  coolors.co screenshots you sent). One pastel-only palette got a fixed dark
  base for text readability, noted in the file.
- Colors are now CSS variables (`tailwind.config.ts` + `globals.css`), so
  switching themes is instant, no reload - `components/ThemeSwitcher.tsx`
  applies them client-side and saves the choice via `PATCH /api/accounts/settings`
- `Account.themeId` persists the choice per account

### #3 Manage view (TikTok Studio style)
- `/dashboard/manage` — filter by status (All/Scheduled/Posted/Draft), sort by
  newest/views/engagement, same visual language as TikTok Studio's post list
- Shows the exploration-cycle progress ring here too, plus a plain-language
  note on whether the account is still learning or locked into its best times
- `GET /api/videos?sortBy=` now supports `newest`, `views`, `engagement`

### #4 Post numbering ("Post 25:", "Part 1:")
- Toggle in dashboard settings (gear icon) - off by default
- Choose the label: Post / Part / Ep
- When on, `Account.postNumberCounter` increments each time a caption is
  generated, and the number gets prefixed onto the caption automatically
- `Post.partNumber` + `Post.seriesLabel` store what was actually used, so it's
  stable even if you change the label later

### #5 Thumbnail selection (honest version)
- `lib/thumbnail.ts` - toggle is named `autoSelectThumbnail`, not
  `autoGenerateThumbnail`, on purpose: Gemini's free tier can look at
  images but can't create new ones. What's built picks the best-looking
  *extracted* frame as the thumbnail using a brightness/subject heuristic.
- If you want true AI-*generated* thumbnails later, that needs a paid image
  model (Imagen/DALL-E), or could route through your existing Canva
  connector instead of a new paid API - noted as a future option, not built.

## Multi-platform posting - honest steps per platform

Only YouTube actually posts right now. Here's what each additional platform
actually requires if/when you want to add it:

**Instagram Reels** - needs a Meta Developer account + an Instagram
Business/Creator account linked to a Facebook Page. Apply for the
`instagram_content_publish` permission via Meta's App Review - similar
wait time to TikTok's review.

**Facebook Reels** - same Meta Developer app as Instagram, different
endpoint. Can often be requested in the same App Review batch.

**Pinterest** - has a public API for "Idea Pins"/video pins, generally
faster approval than Meta or TikTok, no lengthy review process reported
as of last check - worth confirming current process before building.

**X (Twitter)** - video upload via API v2 now sits behind a paid API tier
(Basic tier and up) - there's no meaningful free posting tier anymore, so
this one has a real ongoing cost if added.

Given TikTok is already the priority once its review clears, I'd rank any
future addition as: Pinterest (easiest) → Instagram/Facebook (same app,
one review) → X (only if you're fine with the paid tier).
