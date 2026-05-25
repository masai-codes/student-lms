# AI Tutor — End-to-End Flow

A step-by-step reference for the lecture AI tutor (text chat + voice chat). Use this to trace any user action from the UI through every file it touches.

---

## Services involved

| Service | Role |
|---|---|
| **LMS app** (`student-lms-experience`) | UI + TanStack Start file routes that own the chat state and DB. |
| **LiveKit token server** (Python, `TOKEN_SERVER_URL`) | Provisions LiveKit rooms/tokens, dispatches the AI agent, stores voice transcripts. |
| **LiveKit cloud / SFU** | WebRTC transport for the voice room. |
| **OpenAI Chat Completions** | Generates text replies for typed messages. |

---

## High-level data flow

```
User types ──► useLectureAiChat.sendMessage
            └► useAiTutorSession.ensureConnected  (must succeed first!)
                  └► POST /api/learn/ai-tutor/$lectureId/session  ── token server /generate-session
                  └► livekit-client room.connect(url, token)
                  └► POST /api/learn/ai-tutor/$lectureId/dispatch ── token server /dispatch
            └► useAiTutorMessages.send
                  └► POST /api/learn/ai-chat/$lectureId/send ── OpenAI Chat Completions
                                                                └► INSERT INTO aiChatMessages (x2)

User taps mic ──► useAiTutorMic.toggleMic
              └► ensureConnected (same as above)
              └► livekit useTrackToggle(Microphone) publishes audio track to LiveKit
              ── Python agent in the room does STT/LLM/TTS, streams audio + transcript text back
              └► useTranscriptions() pushes live text into the merged message list
```

---

## Mounting (shared between text + voice)

| # | File | What it does |
|---|---|---|
| 1 | `src/components/features/learn/LearnPageDetails/lecture/ai-chat/LectureAiChatProvider.tsx` | Creates a single `Room` per lecture, wraps the tree in `RoomContext.Provider`, mounts `<RoomAudioRenderer />` so the agent's voice is audible. Client-only via `ClientOnly`. |
| 2 | `src/components/features/learn/LearnPageDetails/lecture/ai-chat/hooks/useLectureAiChat.ts` | Composes the four sub-hooks (`useAiTutorSession`, `useAiTutorMessages`, `useAiTutorMic`, `useAiTutorAgentSpeaking`) and exposes `sendMessage`, `toggleMic`, `endSession` to the UI. |
| 3 | `src/components/features/learn/LearnPageDetails/lecture/ai-chat/LectureAiChatStateContext.tsx` | Shares the hook's state between sidebar (`LectureAiChatTheaterSidebar.tsx`) and dock (`LectureAiChatDock.tsx`). |
| 4 | `src/components/features/learn/LearnPageDetails/lecture/ai-chat/LectureAiChatPanel.tsx` + `LectureAiChatBar.tsx` + `LectureAiChatMessage.tsx` | Renders the message list, status badge, input box, mic button. |

---

## 1. Text chat — end to end

### 1a. Frontend (browser)

| Step | File | Function | What happens |
|---|---|---|---|
| 1 | `…/ai-chat/LectureAiChatBar.tsx` | `onKeyDown` / send button | User types and presses Enter. Calls `onSend` prop. |
| 2 | `…/ai-chat/hooks/useLectureAiChat.ts` | `sendMessage` | Trims text. Calls `session.ensureConnected()` **before** sending — text chat will not send if the LiveKit session can't be created. |
| 3 | `…/ai-chat/hooks/useAiTutorSession.ts` | `ensureConnected` | If not already connected, runs the session-create flow (see §2a). |
| 4 | `…/ai-chat/hooks/useAiTutorMessages.ts` | `send` | Inserts an optimistic `pending` message (`source: 'live-text'`), then calls the API client. |
| 5 | `src/lib/api/learn/aiChatApi.ts` | `sendAiChatMessageRequest` | `POST /api/learn/ai-chat/$lectureId/send` with `{ message }`. |

### 1b. Server (LMS Next/TanStack Start)

| Step | File | What happens |
|---|---|---|
| 6 | `src/routes/api/learn/ai-chat/$lectureId/send.ts` | Route definition; forwards to handler. |
| 7 | `src/server/api/ai-chat/handlers/sendMessage.handler.ts` | `requireSessionUserId`, parses body with Zod (`message` ≤ 4 000 chars), calls service. |
| 8 | `src/server/ai-chat/services/sendAiChatMessage.ts` | Pipeline: |
|   |   | 1. `resolveAiTutorLectureContext` — access + lecture + transcript (see §4). |
|   |   | 2. `listRecentAiChatMessagesForContext` — last 16 turns. |
|   |   | 3. `insertAiChatMessage(role:'user', source:'text')`. |
|   |   | 4. `buildChatPromptMessages` — system prompt + lecture summary (clamped 8 000 chars) + history + user msg. |
|   |   | 5. `requestOpenAiChatCompletion` — OpenAI call. |
|   |   | 6. `insertAiChatMessage(role:'assistant', source:'text')`. |
|   |   | 7. Returns `{ userMessage, assistantMessage }`. |
| 9 | `src/server/ai-tutor/services/aiTutorLectureAccess.ts` | Access checks + loads `lecturesAi.summary \|\| lecturesAi.transcript`. |
| 10 | `src/server/ai-chat/services/aiChatMessages.repo.ts` | `insertAiChatMessage`, `listAiChatMessages`, `listRecentAiChatMessagesForContext` (Drizzle, `aiChatMessages` table). |
| 11 | `src/server/ai-chat/services/buildChatPrompt.ts` | Builds the OpenAI `messages` array. System prompt lives at `AI_CHAT_SYSTEM_PROMPT`. |
| 12 | `src/server/ai-chat/clients/openAiChatCompletions.ts` | `POST https://api.openai.com/v1/chat/completions`, model `gpt-4.1-mini`, temp 0.4, 30 s timeout. Needs `OPENAI_API_KEY`. |

### 1c. Back on the frontend

| Step | File | What happens |
|---|---|---|
| 13 | `…/ai-chat/hooks/useAiTutorMessages.ts` | Replaces the optimistic `pending` row, merges the two new DB rows into `history`. |
| 14 | `…/ai-chat/utils/mergeChatMessages.ts` | Dedupes by `id`, sorts by timestamp. |
| 15 | `…/ai-chat/LectureAiChatPanel.tsx` → `LectureAiChatMessage.tsx` | Renders. |

---

## 2. Voice chat — end to end

### 2a. Session creation (runs once per chat session; triggered by typing OR tapping mic)

| Step | File | What happens |
|---|---|---|
| 1 | `…/ai-chat/hooks/useAiTutorMic.ts` | `toggleMic` — if mic is off, calls `ensureConnected()` then `toggle(true)` to publish the LiveKit mic track. |
| 2 | `…/ai-chat/hooks/useAiTutorSession.ts` | `ensureConnected` runs three things sequentially: |
|   |   | a. `createAiTutorSessionRequest` (HTTP). |
|   |   | b. `room.connect(url, token)` (WebRTC, direct to LiveKit). |
|   |   | c. `dispatchAiTutorAgentRequest` (HTTP), unless an agent participant already exists in the room. |
| 3 | `src/lib/api/learn/aiTutorApi.ts` | `createAiTutorSessionRequest`, `dispatchAiTutorAgentRequest`, `endAiTutorSessionRequest`, `endAiTutorSessionWithBeacon`. |

Server side — create:

| Step | File | What happens |
|---|---|---|
| 4 | `src/routes/api/learn/ai-tutor/$lectureId/session.ts` | Route definition. |
| 5 | `src/server/api/ai-tutor/handlers/createSession.handler.ts` | Auth, body parse, calls service. |
| 6 | `src/server/ai-tutor/services/aiTutorSession.service.ts` → `createAiTutorSession` | 1. `checkAiTutorDailyLimit` (`AI_TUTOR_DAILY_LIMIT = 1000`). 2. `resolveAiTutorLectureContext`. 3. `createAiTutorSessionRecord` (insert pending row). 4. `generateSessionOnTokenServer`. 5. `attachTokenServerSessionToRecord` (write LiveKit creds back). 6. On failure: `markRecordFailed`. |
| 7 | `src/server/ai-tutor/services/aiTutorDailyLimit.ts` | UTC-day query over `aiTutorSessions`. |
| 8 | `src/server/ai-tutor/services/aiTutorLectureAccess.ts` | Same access/transcript check used by text chat. |
| 9 | `src/server/ai-tutor/services/aiTutorSessionRecords.ts` | DB ops on `aiTutorSessions` (`createAiTutorSessionRecord`, `attachTokenServerSessionToRecord`, `markRecordFailed`, `listSessionsForLecture`, `updateLatestSessionFeedback`). |
| 10 | `src/server/ai-tutor/clients/aiTutorTokenServer.ts` | `POST {TOKEN_SERVER_URL}/generate-session` with `{ participantName, language, unique_id, lecture_id, lecture_transcript, duration_minutes }`. Validates the response shape. |

Server side — dispatch:

| Step | File | What happens |
|---|---|---|
| 11 | `src/routes/api/learn/ai-tutor/$lectureId/dispatch.ts` | Route definition. |
| 12 | `src/server/api/ai-tutor/handlers/dispatchAgent.handler.ts` | Auth, body parse, calls service. |
| 13 | `src/server/ai-tutor/services/aiTutorSession.service.ts` → `dispatchAiTutorAgent` | Ownership check via `listSessionsForLecture`, then `dispatchAgentOnTokenServer`. |
| 14 | `src/server/ai-tutor/clients/aiTutorTokenServer.ts` | `POST {TOKEN_SERVER_URL}/dispatch` with `{ room_name, agent_name }`. Default agent name = `process.env.LIVEKIT_AGENT_NAME \|\| 'local-agent'`. |

### 2b. Live voice (audio + transcript)

After dispatch, the Python agent joins the LiveKit room. **Nothing flows through the LMS server during the live conversation.**

| Step | File | What happens |
|---|---|---|
| 15 | LiveKit | Browser publishes mic track → agent receives audio → STT → LLM → TTS → audio track back. |
| 16 | `…/ai-chat/LectureAiChatProvider.tsx` — `<RoomAudioRenderer />` | Plays the agent's outgoing audio. |
| 17 | `…/ai-chat/hooks/useAiTutorAgentSpeaking.ts` | Watches `RoomEvent.ActiveSpeakersChanged` for an identity matching `agent\|tutor` → drives the "AI Tutor is speaking" badge. |
| 18 | `…/ai-chat/hooks/useAiTutorSession.ts` | `RoomEvent.ParticipantConnected/Disconnected` → `agentJoined`. |
| 19 | `…/ai-chat/hooks/useAiTutorMessages.ts` → `useTranscriptions()` | Reads LiveKit text-stream transcripts the agent emits, mapped to `{ source: 'live-voice' }` and merged into the unified timeline. |

### 2c. Ending the session

| Step | File | What happens |
|---|---|---|
| 20 | `…/ai-chat/hooks/useAiTutorSession.ts` | `endSession` (manual) or `beforeunload` handler (uses `navigator.sendBeacon`). |
| 21 | `src/lib/api/learn/aiTutorApi.ts` | `endAiTutorSessionRequest` / `endAiTutorSessionWithBeacon`. |
| 22 | `src/routes/api/learn/ai-tutor/end.ts` → `src/server/api/ai-tutor/handlers/endSession.handler.ts` | Validates `{ sessionId }`. |
| 23 | `src/server/ai-tutor/services/aiTutorSession.service.ts` → `endAiTutorSession` | Calls `endSessionOnTokenServer` (`POST {TOKEN_SERVER_URL}/end`). **No DB write here** — the row stays as-is. |

---

## 3. Unified history (the panel shows text + voice together)

| Step | File | What happens |
|---|---|---|
| 1 | `…/ai-chat/hooks/useAiTutorMessages.ts` | On mount or when `refetchKey` (current `sessionId`) changes, calls `fetchAiChatHistoryRequest`. |
| 2 | `src/lib/api/learn/aiChatApi.ts` | `GET /api/learn/ai-chat/$lectureId/history`. |
| 3 | `src/routes/api/learn/ai-chat/$lectureId/history.ts` → `src/server/api/ai-chat/handlers/getHistory.handler.ts` | Auth, calls service. |
| 4 | `src/server/ai-chat/services/getAiChatHistory.ts` | In parallel: `listAiChatMessages` (DB text rows) **and** `fetchAiTutorTranscript` (voice transcripts from the token server). Merges, sorts by timestamp. |
| 5 | `src/server/ai-tutor/services/aiTutorSession.service.ts` → `fetchAiTutorTranscript` | For each past session of this `(user, lecture)`, calls `fetchTranscriptOnTokenServer`. Failures are swallowed via `Promise.allSettled`. |
| 6 | `src/server/ai-tutor/clients/aiTutorTokenServer.ts` → `fetchTranscriptOnTokenServer` | `GET {TOKEN_SERVER_URL}/transcript/:sessionId`. |
| 7 | `…/ai-chat/hooks/useAiTutorMessages.ts` | Maps DB rows + voice entries into `LectureChatMessage`, then `mergeChatMessages(history, pending, liveVoice)`. |
| 8 | `…/ai-chat/LectureAiChatPanel.tsx` | Renders the merged timeline. |

Voice content is **never written to the LMS DB**. It lives on the Python token server; the LMS DB only stores session metadata (`aiTutorSessions`) and text rows (`aiChatMessages`).

---

## 4. Shared access gate (used by BOTH modes)

`src/server/ai-tutor/services/aiTutorLectureAccess.ts` → `resolveAiTutorLectureContext`:

1. `loadUserRoleAndName` — must exist, else `UNAUTHORIZED`.
2. If role ≠ `admin` → must have `sectionUser` row mapping to a section that owns this lecture, else `AI_TUTOR_LECTURE_FORBIDDEN`.
3. `loadLecture` — non-deleted lecture, else `AI_TUTOR_LECTURE_NOT_FOUND`.
4. `loadTranscript` — `lecturesAi.summary \|\| lecturesAi.transcript`, else `AI_TUTOR_TRANSCRIPT_UNAVAILABLE`.

If this throws, **both** text chat and voice chat fail with the same code.

---

## 5. All API routes

| Route | Handler | Service entry point |
|---|---|---|
| `POST /api/learn/ai-tutor/$lectureId/session` | `createSession.handler.ts` | `createAiTutorSession` |
| `POST /api/learn/ai-tutor/$lectureId/dispatch` | `dispatchAgent.handler.ts` | `dispatchAiTutorAgent` |
| `POST /api/learn/ai-tutor/end` | `endSession.handler.ts` | `endAiTutorSession` |
| `GET  /api/learn/ai-tutor/$lectureId/transcript` | `getTranscript.handler.ts` | `fetchAiTutorTranscript` |
| `GET  /api/learn/ai-tutor/limit` | `getLimit.handler.ts` | `fetchAiTutorLimit` |
| `POST /api/learn/ai-tutor/$lectureId/feedback` | `submitFeedback.handler.ts` | `submitAiTutorFeedback` |
| `POST /api/learn/ai-chat/$lectureId/send` | `sendMessage.handler.ts` | `sendAiChatMessage` |
| `GET  /api/learn/ai-chat/$lectureId/history` | `getHistory.handler.ts` | `getAiChatHistory` |

Routes live under `src/routes/api/learn/...`, handlers under `src/server/api/...`, services under `src/server/ai-tutor/...` and `src/server/ai-chat/...`. Every handler passes through `requireSessionUserId` and `mapThrownErrorToResponse`.

---

## 6. Session state machine (frontend)

`AiTutorSessionState` from `…/ai-chat/types.ts`:

```
idle ──ensureConnected──► creating ──create OK──► connecting ──room.connect OK──► connected
  ▲                                                                                    │
  │                                                  any failure                       │
  │                                          ──────────────────► error                 │
  │                                                                                    │
  └──────────────────────── endSession ──── ending ◄──────────────────────────────────┘
```

Where each transition fires: see `ensureConnected` and `endSession` in `…/ai-chat/hooks/useAiTutorSession.ts`.

---

## 7. Common failure modes & where to look

| Symptom | Likely cause | File to inspect |
|---|---|---|
| Text chat fails too when voice is broken | `sendMessage` calls `ensureConnected()` first | `…/hooks/useLectureAiChat.ts` (`sendMessage`) |
| `AI_TUTOR_TOKEN_SERVER_NOT_CONFIGURED` | `TOKEN_SERVER_URL` env unset | `src/server/ai-tutor/clients/aiTutorTokenServer.ts` |
| `AI_TUTOR_TOKEN_SERVER_INVALID_RESPONSE` | Python token server returned 200 but missing `session_id/room_name/url/token/...` | same file, `generateSessionOnTokenServer` |
| Agent never shown as joined / speaking | Agent identity doesn't include `agent` or `tutor` | `isAgentParticipantIdentity` in `useAiTutorSession.ts`, regex in `useAiTutorMessages.ts:34`, `isAgentParticipant` in `useAiTutorAgentSpeaking.ts` |
| Optimistic user msg disappears | OpenAI failed after the user row was inserted | `sendAiChatMessage.ts` (rows are sequenced: user-row → OpenAI → assistant-row) |
| `AI_TUTOR_TRANSCRIPT_UNAVAILABLE` | `lecturesAi` row missing or empty `summary`/`transcript` for this lecture | `aiTutorLectureAccess.ts` → `loadTranscript` |
| History missing voice content | Token server unreachable; failure is swallowed | `getAiChatHistory.ts` (`.catch(() => [])`) |
| Daily limit miscounts | Only counts rows where `sessionId IS NOT NULL` | `aiTutorDailyLimit.ts` |
| Session never marked ended in DB | `endAiTutorSession` only calls token server | `aiTutorSession.service.ts` |
| Tab close doesn't end room | `beforeunload` uses `sendBeacon` — no response visibility | `useAiTutorSession.ts` + `endAiTutorSessionWithBeacon` |

---

## 8. Environment variables

| Variable | Used by | Purpose |
|---|---|---|
| `TOKEN_SERVER_URL` | `aiTutorTokenServer.ts` | Base URL of the Python LiveKit token server. |
| `TOKEN_SERVER_TIMEOUT_MS` | same | Per-request timeout, default 15 000 ms. |
| `LIVEKIT_AGENT_NAME` | `aiTutorSession.service.ts` | Agent name to dispatch; default `local-agent`. |
| `OPENAI_API_KEY` | `openAiChatCompletions.ts` | Required for text chat. |
| `AI_CHAT_OPENAI_TIMEOUT_MS` | same | Per-request timeout, default 30 000 ms. |

---

## 9. DB tables touched

| Table | Written by | Notes |
|---|---|---|
| `aiTutorSessions` | `createAiTutorSessionRecord`, `attachTokenServerSessionToRecord`, `markRecordFailed`, `updateLatestSessionFeedback` | One row per voice session attempt; `sessionId` is `NULL` until the token server responds. |
| `aiChatMessages` | `insertAiChatMessage` (only `source:'text'` in practice today) | Text chat persistent store. |
| `lecturesAi` | (read-only) | Source of the lecture transcript/summary used as prompt context. |
| `lectures`, `sectionUser`, `users` | (read-only) | Access checks. |
