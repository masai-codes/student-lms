# AI Tutor chat conversations

Last updated: 2026-06-24

## Scope

- `GET /api/ai-tutor/chat/conversations?lectureId={id}` — list the signed-in user's lecture chat threads from `ai_chat_practice_questions`, sorted by `updatedAt` descending.
- `GET /api/ai-tutor/chat/conversations/:chatId` — load one thread's turns (oldest → newest).

## Database tables

- `ai_chat_practice_questions` — per-user lecture chat thread + `chatHistory` JSON

## Responses

List:

```json
{
  "conversations": [
    {
      "chatId": 45,
      "title": "What is useState?",
      "updatedAt": "2026-06-22 10:00:00"
    }
  ]
}
```

Detail:

```json
{
  "chatId": 45,
  "chat": [
    { "role": "user", "content": "What is useState?" },
    { "role": "assistant", "content": "useState is a React hook..." }
  ]
}
```

Conversation titles are derived from the first user message (truncated to 50 characters) or `"New chat"` when empty.

## Test cases

| ID | Case | Expected |
|----|------|----------|
| AT-CONV-001 | Missing session cookie | `401 UNAUTHORIZED` |
| AT-CONV-002 | Invalid `lectureId` query param | `400 AI_TUTOR_LECTURE_ID_INVALID` |
| AT-CONV-003 | Valid list request | `200` with `conversations[]` sorted by service query |
| AT-CONV-004 | Invalid `chatId` path param | `400 AI_TUTOR_CHAT_ID_INVALID` |
| AT-CONV-005 | Unknown `chatId` for user | `404 AI_TUTOR_CHAT_NOT_FOUND` |
| AT-CONV-006 | Valid detail request | `200` with ordered `chat` turns |
| AT-CONV-007 | Title + turn mapping utils | First user message title + user/assistant turns |

## Commands

```bash
npm run test -- src/server/api/ai-tutor/__tests__
```
