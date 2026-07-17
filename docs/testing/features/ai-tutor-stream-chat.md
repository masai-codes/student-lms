# AI Tutor streaming chat

Last updated: 2026-07-10

## Scope

- `POST /api/ai-tutor/chat/stream` — authenticated SSE lecture chat backed by `ai_chat_practice_questions`, lecture summary, instructor notes, and LLM-driven RAG retrieval via tool calling.

## Data sources

- `ai_chat_practice_questions` — per-user lecture chat thread + `chatHistory` JSON
- `lectures.title` — included in the system prompt
- `lectures_ai.summary` — always included in the system prompt
- `lectures.notes` — inlined when `<= 10,000` chars; otherwise only an outline is shown
- `lecture_zoom_chat.final_chat` — parsed defensively into **Resources shared** in the system prompt
- External RAG platform — ingested notes/transcript; retrieved on demand via `retrieveLectureContent` tool

## Request body

```json
{
  "lectureId": 123,
  "chat": "What is useState?",
  "platform": "web-desktop",
  "chatID": 45,
  "language": "English"
}
```

`platform` is required for web clients: `web-desktop` or `web-mobile`. Mobile native apps send `ios` or `android`. Legacy values `web` and `app` are still accepted.

`chatID` / `chatId` is optional; omit to start a new thread.
`platform` is optional (`ios` | `android` | `web` | `web-mobile` | `web-desktop` | `app`); defaults to `app` and is stored on each persisted `chatHistory` turn.
`language` is optional and defaults to `English`. When provided, the tutor must reply only in that language (technical terms stay in English). Accepts English and major Indian languages by name or ISO code (`en`, `hi`, `ta`, `te`, `kn`, `ml`, `bn`, `mr`, `gu`, `pa`, `or`, `as`). The canonical language name (e.g. `Hindi`) is stored on each `chatHistory` turn alongside `platform`.

## Environment

- `ANTHROPIC_API_KEY` — required
- `ANTHROPIC_MODEL` — optional; defaults to `claude-haiku-4-5`
- `RAG_PLATFORM_BASE_URL` — required for the retrieve tool
- `RAG_PLATFORM_API_KEY` — required for the retrieve tool
- `RAG_PLATFORM_COLLECTION_NAME` — optional; defaults to `student-lms-ai-tutor`

## Retrieval behavior

| ID           | Case                     | Expected                                                            |
| ------------ | ------------------------ | ------------------------------------------------------------------- |
| AT-SSE-001   | Missing session cookie   | `401 UNAUTHORIZED`                                                  |
| AT-SSE-002   | Invalid lectureId        | `400 AI_TUTOR_LECTURE_ID_INVALID`                                   |
| AT-SSE-003   | Empty chat message       | `400 AI_TUTOR_CHAT_MESSAGE_EMPTY`                                   |
| AT-SSE-004   | Chat over max length     | `400 AI_TUTOR_CHAT_MESSAGE_TOO_LONG`                                |
| AT-SSE-005   | Missing Anthropic config | `503 AI_TUTOR_ANTHROPIC_NOT_CONFIGURED`                             |
| AT-SSE-006   | Authenticated request    | SSE token chunks + `{ type: "done", chatId }`                       |
| AT-SSE-006b  | Invalid platform         | `400 AI_TUTOR_PLATFORM_INVALID`                                     |
| AT-SSE-006c  | Invalid language         | `400 AI_TUTOR_LANGUAGE_INVALID`                                     |
| AT-SSE-006d  | Language provided        | System prompt enforces selected language; `language` stored on turn |
| AT-SSE-006d2 | Language omitted         | Defaults to English in prompt and stored history                    |
| AT-SSE-006e  | Mobile platform          | Persists `platform` on the new `chatHistory` turn                   |
| AT-SSE-007   | Stream service           | Loads summary/history, persists turn after stream                   |
| AT-SSE-008   | Prompt builder           | Summary + optional history + question                               |
| AT-SSE-009   | Chat history parser      | Parses stored JSON safely                                           |
- The model decides whether to call `retrieveLectureContent`.
- Tool args: `query` (model-written search query) and `top_k` (1–20).
- Short notes (`<= 10k` chars) are already in the system prompt; long notes show an outline only.
- Lecture summary is always in the system prompt.
- If RAG is unconfigured, the tool is omitted and the tutor answers from summary/notes only.

## Commands

```bash
npm run test -- src/server/api/ai-tutor/__tests__
```
