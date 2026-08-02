# Mock interview practice (`/interviews`)

Last updated: 2026-08-01

## Scope

- `GET /api/interviews/topics` — personalized topic list: catalog topics for the
  student's resolved program domain + topics derived from their coursework.
- `POST /api/interviews/sessions` — starts a session for a topic, generates
  question 1 via Claude.
- `GET /api/interviews/sessions/:sessionId` — session state (turns, status,
  report once completed).
- `POST /api/interviews/sessions/:sessionId/turns` — `multipart/form-data`
  submission of one answer (`audio` file or `typedAnswer` text). The audio
  goes to an OpenRouter audio-input chat model that transcribes AND asks the
  follow-up in one call; on the final question a separate text-only Claude
  call scores the transcript and produces the report.

## Data sources

- `interview_sessions` — one row per session; `turns` (JSON array of
  `{ index, question, transcript, answerSource, askedAt, answeredAt }`) and
  `report` (JSON, set on completion) are the durable record.
- `batches.programDomain` / `batches.program` — keyword-matched to an
  `InterviewDomain` (`resolveInterviewDomain.ts`) from the student's most
  recently enrolled active batch.
- `lectures.module` (not `category`, which is a generic content-type tag like
  `course`/`live-session`) across the student's enrolled sections — distinct
  values become "From your coursework" topics.

## Request/response shapes

`POST /api/interviews/sessions` body: `{ "topicId": "dsa" }` (catalog id, or
`curriculum:<slug>` for a coursework-derived topic — validated against the
user's own resolved topics, never trusted from the client label).
Response: `{ "sessionId": 42, "question": "..." }`.

`POST .../turns` form fields: `audio` (wav file) **or** `typedAnswer` (string).
Response while more questions remain:
`{ "status": "in_progress", "transcript": "...", "nextQuestion": "..." }`.
Response on the last question:
`{ "status": "completed", "transcript": "...", "report": { overallScore, rubric, strengths, improvements, summary } }`.

## Environment

Everything routes through OpenRouter's OpenAI-compatible endpoint — one
`OPENROUTER_API_KEY` covers all three model calls; no separate
`ANTHROPIC_API_KEY` is needed for this feature.

- `OPENROUTER_API_KEY` — required.
- `INTERVIEW_AUDIO_MODEL` — optional; defaults to `google/gemini-3.5-flash` (turn submission: audio/typed → transcript + next question).
- `INTERVIEW_TEXT_MODEL` — optional; defaults to `anthropic/claude-haiku-4.5` (opening question + final report scoring).
- `INTERVIEW_MAX_ANSWER_SECONDS` — optional; defaults to `120` (also bounds the server-side audio size cap).

## Retrieval / case behavior

| ID          | Case                                  | Expected                                                                            |
| ----------- | ------------------------------------- | ----------------------------------------------------------------------------------- |
| IV-TOP-001  | Authenticated request                 | Domain + catalog topics + curriculum topics                                         |
| IV-TOP-002  | No enrolled batch                     | `domain: "general"`, catalog-only (never empty)                                     |
| IV-SES-001  | Unknown/foreign `topicId`             | `400 INTERVIEW_TOPIC_INVALID`                                                       |
| IV-SES-002  | Daily session cap reached             | `429 INTERVIEW_DAILY_LIMIT`                                                         |
| IV-SES-003  | Valid topic                           | Session row created; question 1 returned                                            |
| IV-GET-001  | Session owned by another user         | `403 INTERVIEW_SESSION_FORBIDDEN` (true 404/403 status travels via `x-true-status`) |
| IV-GET-002  | Unknown session id                    | `404 INTERVIEW_SESSION_NOT_FOUND`                                                   |
| IV-TURN-001 | Neither audio nor typedAnswer present | `400 INTERVIEW_ANSWER_EMPTY`                                                        |
| IV-TURN-002 | Audio over the size cap               | `400 INTERVIEW_ANSWER_AUDIO_TOO_LARGE`                                              |
| IV-TURN-003 | Session already completed             | `409 INTERVIEW_SESSION_NOT_IN_PROGRESS`                                             |
| IV-TURN-004 | Model returns an empty transcript     | `422 INTERVIEW_TRANSCRIPT_EMPTY`; turn NOT persisted                                |
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
