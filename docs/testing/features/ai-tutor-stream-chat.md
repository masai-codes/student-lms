# AI Tutor streaming chat

Last updated: 2026-06-22

## Scope

- `POST /api/ai-tutor/chat/stream` — authenticated SSE lecture chat backed by `ai_chat_practice_questions` + `lectures_ai`, streamed from Claude via Vercel AI SDK.

## Database tables

- `ai_chat_practice_questions` — per-user lecture chat thread + `chatHistory` JSON
- `lectures_ai` — lecture summary used as RAG context (`summary` column)

## Request body

```json
{
  "lectureId": 123,
  "chat": "What is useState?",
  "chatID": 45
}
```

`chatID` / `chatId` is optional; omit to start a new thread.

## Environment

- `ANTHROPIC_API_KEY` — required
- `ANTHROPIC_MODEL` — optional; defaults to `claude-opus-4-8`

## Test cases

| ID | Case | Expected |
|----|------|----------|
| AT-SSE-001 | Missing session cookie | `401 UNAUTHORIZED` |
| AT-SSE-002 | Invalid lectureId | `400 AI_TUTOR_LECTURE_ID_INVALID` |
| AT-SSE-003 | Empty chat message | `400 AI_TUTOR_CHAT_MESSAGE_EMPTY` |
| AT-SSE-004 | Chat over max length | `400 AI_TUTOR_CHAT_MESSAGE_TOO_LONG` |
| AT-SSE-005 | Missing Anthropic config | `503 AI_TUTOR_ANTHROPIC_NOT_CONFIGURED` |
| AT-SSE-006 | Authenticated request | SSE token chunks + `{ type: "done", chatId }` |
| AT-SSE-007 | Stream service | Loads summary/history, persists turn after stream |
| AT-SSE-008 | Prompt builder | Summary + optional history + question |
| AT-SSE-009 | Chat history parser | Parses stored JSON safely |

## Commands

```bash
npm run test -- src/server/api/ai-tutor/__tests__
```
