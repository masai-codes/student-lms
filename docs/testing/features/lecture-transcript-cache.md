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
  — no fetch until enabled, one shared fetch for two consumers, error state.
- `src/components/features/learn/LearnPageDetails/lecture/tabs/__tests__/LectureTranscriptTabContent.test.tsx`
  — skeleton → segments, plain-text fallback, empty state, error state, and no
  fetch at all when the lecture has no transcript.

## Manual checks

- Open a long lecture recording: the page renders without waiting on the
  transcript; the Network panel shows no `/api/cache/transcript/...` request yet.
- Toggle CC on: one request fires, captions appear. Toggle off and on again — no
  second request.
- Open the Transcript tab: shimmer skeleton, then timestamped lines. If CC was
  already used, no new request (shared query cache).
- Open a lecture with no transcript: the CC button is hidden and the Transcript tab
  shows the empty state, with no request made.
- On prod, a second student loading the same lecture should get
  `x-cache: Hit from cloudfront` on the transcript request.
