# Lecture transcript — CloudFront-cached, lazily loaded

## Scope

Transcripts used to ship inside the lecture-detail payload, twice over
(`tabs.transcript` plus `tabs.transcriptSegments`). For a long lecture that is
megabytes of JSON on the critical path, and the whole page waited on it
(issue #353). Now:

- `GET /api/learn/lectures/:lectureId` carries only a pointer —
  `tabs.transcript = { available, url }`. No transcript text, and the DB is asked
  only whether a transcript exists (a `char_length` / `json_length` probe in
  `getLectureLearningDetail.service.ts`), never for its contents.
- The transcript itself lives at
  `GET /api/cache/transcript/:batchId/:sectionId/:lectureId` — public,
  cookie-free, and cached at the edge by the `/api/cache/*` CloudFront behavior in
  `cloudformation.yml`. The batch + section are verified against the lecture row,
  so a mismatched triple 404s. The nesting also makes prefix invalidation possible
  (`/api/cache/transcript/<batchId>/*`).
- One representation per response, never both: `segments` when they exist,
  otherwise the plain-text `text` fallback.
- The client fetches it lazily — when **captions are switched on**
  (`LectureReactPlayer`) or when the **Transcript tab is opened**
  (`LectureTranscriptTabContent`). Both go through `useLectureTranscript`, keyed on
  the cache URL, so the two surfaces share a single request.
- `available` is a hint, not a contract: a 404 resolves to an empty transcript and
  the normal "Transcript not available" empty state.
- Once a transcript is on screen, the tab shows a **Download** button
  (`LectureTranscriptDownloadButton`) that writes the already-fetched transcript to
  a `.txt` — `[m:ss] line` per segment, or the plain-text fallback — via the shared
  `downloadTextFile` helper (`src/lib/downloadTextFile.ts`). No second request, and
  no button when there is nothing to save. The file is named from the payload's
  `lectureId` (`lecture-<id>-transcript.txt`), which `useLectureTranscript` now
  exposes; the click fires `l_learn_lecture_transcript_download_id_<id>`.

## Tests

- `src/server/api/cache/__tests__/getLectureTranscript.service.test.ts` — segments
  vs plain-text fallback, the "never both" rule, 404 on an unmatched
  batch/section/lecture triple, 404 rather than caching an empty transcript.
- `src/server/api/cache/handlers/__tests__/getLectureTranscript.handler.test.ts` —
  `Cache-Control` on success (`public, max-age=3600, s-maxage=86400, immutable`)
  vs `no-store` on error, the 404→422 CloudFront remap, invalid id rejection
  before any DB call.
- `src/server/learn/utils/__tests__/buildLectureTabContent.test.ts` — the payload
  carries a pointer and no transcript text; unavailable when there is no
  transcript, or no batch / no section to address it with.
- `src/lib/api/cache/__tests__/lectureTranscriptApi.test.ts` — 404 means "no
  transcript", other statuses propagate.
- `src/components/features/learn/LearnPageDetails/lecture/hooks/__tests__/useLectureTranscript.test.tsx`
  — no fetch until enabled, one shared fetch for two consumers, error state, and
  the `lectureId` exposed from the resolved payload.
- `src/components/features/learn/LearnPageDetails/lecture/tabs/__tests__/LectureTranscriptTabContent.test.tsx`
  — skeleton → segments, plain-text fallback, empty state, error state, no fetch at
  all when the lecture has no transcript, and the Download button present only
  alongside real content.
- `src/components/features/learn/LearnPageDetails/lecture/tabs/__tests__/LectureTranscriptDownloadButton.test.tsx`
  — timestamped segment body vs plain-text fallback, lecture-scoped file name, GTM
  event (with the id-less fallback), and nothing rendered without content.
- `src/components/features/learn/LearnPageDetails/lecture/tabs/__tests__/lectureTranscriptUtils.test.ts`
  — timestamp formatting, download body construction (segments win over the flat
  text; empty when there is nothing), file naming.
- `src/lib/downloadTextFile.test.ts` — named anchor click over a blob URL, mime
  type, deferred revoke, and the server / no-blob-support no-ops.
- `seed/flows/live-lecture-phases/sampleTranscript.test.ts` — the seeded sample
  transcript parses through `parseLectureTranscriptSegments`, has unique ids and
  forward-moving spans, and spans both timestamp formats.

## Seed data

`npm run seed live-lecture-phases` adds two recording lectures in the primary
section purely for transcript QA (both playable, both past-phase):

- **Transcript — timestamped segments (download + CC)** — 28 segments from
  `seed/flows/live-lecture-phases/sampleTranscript.ts`. Long enough to overflow the
  collapsed tab ("Show more"), and its closing block starts at 59:36 so the
  timestamps cover `m:ss` **and** `h:mm:ss`.
- **Transcript — plain text only (no segments)** — `lectures_ai.transcript` set,
  `transcript_segments` empty: the shape older lectures have, and the fallback path
  for both the tab and the download.

Ids land in `seed/catalog/seed-state.json` as `transcriptSegmentedLectureId` /
`transcriptPlainTextLectureId`, and both lectures are listed in the seed catalog
page (`npm run seed:catalog`).

## Manual checks

- Open a long lecture recording: the page renders without waiting on the
  transcript; the Network panel shows no `/api/cache/transcript/...` request yet.
- Toggle CC on: one request fires, captions appear. Toggle off and on again — no
  second request.
- Open the Transcript tab: shimmer skeleton, then timestamped lines. If CC was
  already used, no new request (shared query cache).
- Open a lecture with no transcript: the CC button is hidden and the Transcript tab
  shows the empty state, with no Download button and no request made.
- Click Download on the segmented seed lecture: a `lecture-<id>-transcript.txt`
  lands with `[m:ss]` lines (and `[1:00:00]` near the end), and no new network
  request fires.
- Repeat on the plain-text seed lecture: the tab shows flat paragraphs and the file
  has no timestamp prefixes.
- On prod, a second student loading the same lecture should get
  `x-cache: Hit from cloudfront` on the transcript request.
