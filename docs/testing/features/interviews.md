# Mock interview practice (`/interviews`)

Last updated: 2026-08-02

## Scope

- `GET /api/interviews/topics` — personalized topic list: catalog topics for the
  student's resolved program domain + topics derived from their coursework.
- `GET /api/interviews/sessions` — lightweight summaries (`id`, `topicLabel`,
  `status`, `createdAt`, `completedAt`) of every session the current user has
  started, newest first. Rendered on `/interviews` as "Your sessions" above the
  topic picker — completed sessions show a check icon, `in_progress`/`abandoned`
  a dashed-circle icon, and each row's relative start time comes from
  `dayjs(...).fromNow()`. Clicking a row navigates to `/interviews/:sessionId`.
- `POST /api/interviews/sessions/stream` (SSE, what the UI uses) /
  `POST /api/interviews/sessions` (blocking, kept for API completeness) —
  starts a session for a topic. One audio-out call to the audio-capable model
  generates AND speaks the opening greeting + question 1 together (a brief,
  warm greeting mentioning the topic, then the question) — there's no prior
  answer to respond to yet, so this is a kickoff trigger rather than a real
  turn. Streamed as `audio-delta` SSE events the same way a turn's response
  is, then a terminal `done` event with `{ sessionId, question }` once the
  session row is created.
- `GET /api/interviews/sessions/:sessionId` — session state (turns, status,
  report once completed).
- `POST /api/interviews/sessions/:sessionId/turns/stream` (SSE, what the UI
  actually uses) / `POST .../turns` (blocking, kept for API completeness) —
  `multipart/form-data` submission of one answer (`audio` file or
  `typedAnswer` text). One audio-in/audio-out call to the audio-capable model
  (`INTERVIEW_AUDIO_MODEL`) hears (or reads) the answer and speaks its
  response directly — either the next question or a closing remark on the
  final turn — streamed to the client as `audio-delta` SSE events and played
  in the browser. Whether the interview continues is decided server-side by
  turn count against `INTERVIEW_TOTAL_QUESTIONS`, not by the model. On the
  final turn, a separate call to the same audio-capable model grades the
  interview directly from the raw per-turn answer audio and produces the
  report.

## Data sources

- `interview_sessions` — one row per session; `turns` (JSON array of
  `{ index, question, transcript, answerAudioBase64, answerSource, askedAt, answeredAt }`)
  and `report` (JSON, set on completion) are the durable record. `answeredAt
=== ''` is the "still pending" sentinel. Voice-answered turns store the raw
  base64 WAV in `answerAudioBase64` (no text transcript exists for them — the
  model never transcribes, it just responds) and replay it as conversation
  memory on later turns and as grading input for the final report; typed
  turns instead keep their literal text in `transcript`.
- `batches.programDomain` / `batches.program` — keyword-matched to an
  `InterviewDomain` (`resolveInterviewDomain.ts`) from the student's most
  recently enrolled active batch.
- `lectures.module` (not `category`, which is a generic content-type tag like
  `course`/`live-session`) across the student's enrolled sections — distinct
  values become "From your coursework" topics.

## Request/response shapes

`POST /api/interviews/sessions` / `.../sessions/stream` body: `{ "topicId":
"dsa" }` (catalog id, or `curriculum:<slug>` for a coursework-derived topic —
validated against the user's own resolved topics, never trusted from the
client label). The stream route emits `audio-delta` (`{ data: base64 pcm16
}`) events as the greeting/question is spoken, then a terminal `done` event
with `{ "result": { "sessionId": 42, "question": "..." } }` — `question` here
is the full spoken text (greeting included), not just the question sentence.
The blocking route returns `{ "sessionId": 42, "question": "..." }` directly
(same shape, no audio).

`POST .../turns` / `.../turns/stream` form fields: `audio` (wav file) **or**
`typedAnswer` (string). The stream route emits `audio-delta` (`{ data: base64
pcm16 }`) events as the spoken response is generated, then a terminal `done`
event whose `result` is:
while more questions remain: `{ "status": "in_progress", "nextQuestion": "..." }`;
on the last question: `{ "status": "completed", "report": { overallScore, rubric, strengths, improvements, summary } }`.
There is no `transcript` field in the result anymore — voice answers are
never transcribed to text, only spoken to and answered by the model.

## Environment

Everything routes through OpenRouter's OpenAI-compatible endpoint, all through
one audio-capable model — one `OPENROUTER_API_KEY` covers it; no separate
text model or `ANTHROPIC_API_KEY` is needed for this feature anymore.

- `OPENROUTER_API_KEY` — required.
- `INTERVIEW_AUDIO_MODEL` — optional; defaults to `openai/gpt-audio-mini`. Must support `input_audio` content parts and spoken `audio` output (`modalities: ['text','audio']`, `stream: true` — OpenAI only accepts `['text']` or `['text','audio']`, and audio output requires streaming). Used for the opening greeting/question, every turn (spoken response, streamed), and final report grading (plain-text output over the turns' raw audio — this model doesn't support `json_schema` structured output, so the report is parsed out of a delimited plain-text convention instead).
- `INTERVIEW_MAX_ANSWER_SECONDS` — optional; defaults to `120` (also bounds the server-side audio size cap).

## Retrieval / case behavior

| ID          | Case                                  | Expected                                                                            |
| ----------- | ------------------------------------- | ----------------------------------------------------------------------------------- |
| IV-TOP-001  | Authenticated request                 | Domain + catalog topics + curriculum topics                                         |
| IV-TOP-002  | No enrolled batch                     | `domain: "general"`, catalog-only (never empty)                                     |
| IV-SES-001  | Unknown/foreign `topicId`             | `400 INTERVIEW_TOPIC_INVALID`                                                       |
| IV-SES-002  | Daily session cap reached             | `429 INTERVIEW_DAILY_LIMIT`                                                         |
| IV-SES-003  | Valid topic                           | Session row created; spoken greeting + question 1 returned                          |
| IV-GET-001  | Session owned by another user         | `403 INTERVIEW_SESSION_FORBIDDEN` (true 404/403 status travels via `x-true-status`) |
| IV-GET-002  | Unknown session id                    | `404 INTERVIEW_SESSION_NOT_FOUND`                                                   |
| IV-LIST-001 | Authenticated request                 | Session summaries for the caller only, newest first                                 |
| IV-LIST-002 | No sessions started yet               | Empty array; "Your sessions" section hidden                                         |
| IV-TURN-001 | Neither audio nor typedAnswer present | `400 INTERVIEW_ANSWER_EMPTY`                                                        |
| IV-TURN-002 | Audio over the size cap               | `400 INTERVIEW_ANSWER_AUDIO_TOO_LARGE`                                              |
| IV-TURN-003 | Session already completed             | `409 INTERVIEW_SESSION_NOT_IN_PROGRESS`                                             |
| IV-TURN-004 | Model has nothing to say              | `422 INTERVIEW_RESPONSE_EMPTY`; turn NOT persisted                                  |
| IV-TURN-005 | More questions remain                 | Turn appended; next question returned                                               |
| IV-TURN-006 | Final question answered               | Report generated; session marked `completed`                                        |

## Client-side audio encoding

`MediaRecorder` output (`webm`/`opus` on Chrome, `mp4`/`aac` on Safari) is not
in OpenRouter's accepted audio format list, so `src/lib/audio/encodeWav.ts`
re-encodes to 16kHz mono PCM16 WAV client-side before upload
(`AudioContext.decodeAudioData` → downmix → linear resample → PCM16 + WAV
header). Covered directly: valid RIFF/WAVE header, expected sample rate/channels,
mono downmix averaging, resample length, PCM clipping.

`useInterviewRecorder` (record → stop → preview → discard/re-record, with a
`permissionDenied` flag for the typed-answer fallback) was extracted from the
announcements voice-note composer (`MessageDetailPage.tsx`) so there's one
implementation instead of two; `MessageDetailPage.test.tsx` is the regression
check that the voice-note flow still records and uploads after the extraction.

## Client-side audio playback

The interviewer's spoken response is real synthesized speech from the model
(not browser TTS) — `src/lib/audio/interviewAudioPlayer.ts` decodes each
base64 24kHz mono PCM16 `audio-delta` chunk and schedules it on a single
`AudioContext` back-to-back with the previous chunk for gapless playback as
the response streams in, rather than waiting for the full response first.
No-ops (SSR/jsdom/unsupported browsers) when `AudioContext` isn't available.

## Seed data

`multi-program-student` already covers both personalization branches — the
student is enrolled in an SDE-ish batch (`program: 'SDE'`, lecture module
`JavaScript Fundamentals`) and a Data Science batch (`program: 'Data Science'`,
lecture module `Data Analysis`) — domain resolves to the most recently
enrolled batch (`data-ai-ml`), and curriculum topics are drawn from lectures
across both enrolled sections.

```bash
npm run seed multi-program-student
# Login: multi-program-student.student@example.com / password
```

## Commands

```bash
npm run test -- src/server/api/interviews src/lib/audio src/hooks/__tests__/useInterviewRecorder.test.tsx
```

## Data-testid selectors

- `interview-session-list` — container for the "Your sessions" rows on `/interviews`.
- `interview-session-item` (`data-session-id`, `data-status`) — one row per past/in-progress session.
