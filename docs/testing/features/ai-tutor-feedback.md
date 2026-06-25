# AI Tutor chat feedback

Last updated: 2026-06-25

## Scope

- `POST /api/ai-tutor/chat/feedback` — persist the signed-in user's rating and optional feedback for a lecture chat thread in `ai_chat_practice_questions`.

## Database tables

- `ai_chat_practice_questions` — `rating`, `feedback`, `feedbackTime` columns on the chat thread row

## Request body

```json
{
  "lectureId": 123,
  "chatId": 45,
  "rating": 4,
  "feedback": "optional text"
}
```

`rating` must be an integer from 1 to 5. `feedback` is optional and trimmed to 191 characters.

## Response

```json
{
  "chatId": 45,
  "rating": 4,
  "feedback": "optional text"
}
```

## Test cases

| ID | Case | Expected |
|----|------|----------|
| AT-FB-001 | Missing session cookie | `401 UNAUTHORIZED` |
| AT-FB-002 | Invalid `lectureId` | `400 AI_TUTOR_LECTURE_ID_INVALID` |
| AT-FB-003 | Invalid `chatId` | `400 AI_TUTOR_CHAT_ID_INVALID` |
| AT-FB-004 | Invalid `rating` | `400 AI_TUTOR_RATING_INVALID` |
| AT-FB-005 | Unknown chat for user/lecture | `404 AI_TUTOR_CHAT_NOT_FOUND` |
| AT-FB-006 | Valid request | `200` with saved rating/feedback |
| AT-FB-007 | Blank feedback text | Stored as `null` |
| AT-FB-008 | Feedback over max length | Trimmed to 191 characters |

## Commands

```bash
npm run test -- src/server/api/ai-tutor/__tests__
```
