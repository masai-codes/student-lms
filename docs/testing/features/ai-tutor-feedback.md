# AI Tutor chat feedback

Last updated: 2026-07-03

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
  "feedback": "optional text",
  "platform": "ios"
}
```

`platform` is optional (`ios` | `android` | `web`) and defaults to `web`.

Rating rules by platform:

- `web`: integer `0` (bad) or `1` (good), stored as-is
- `ios` / `android`: integer `1`–`5`, stored as `rating + 1` (so `2`–`6` in the database)

`feedback` is optional. When present, the platform is stored in the `feedback` column as a prefix joined with `-` (for example `ios-Great session`). When feedback text is blank, only the platform value is stored (for example `web`).

Feedback text is trimmed and the full stored value is capped at 191 characters.

## Response

```json
{
  "chatId": 45,
  "rating": 5,
  "feedback": "ios-Great session"
}
```

## Test cases

| ID | Case | Expected |
|----|------|----------|
| AT-FB-001 | Missing session cookie | `401 UNAUTHORIZED` |
| AT-FB-002 | Invalid `lectureId` | `400 AI_TUTOR_LECTURE_ID_INVALID` |
| AT-FB-003 | Invalid `chatId` | `400 AI_TUTOR_CHAT_ID_INVALID` |
| AT-FB-004 | Invalid `rating` for platform | `400 AI_TUTOR_RATING_INVALID` |
| AT-FB-005 | Invalid `platform` | `400 AI_TUTOR_PLATFORM_INVALID` |
| AT-FB-006 | Unknown chat for user/lecture | `404 AI_TUTOR_CHAT_NOT_FOUND` |
| AT-FB-007 | Valid web request | `200` with rating `0`/`1` and `web-...` feedback |
| AT-FB-008 | Valid mobile request | `200` with shifted rating and `ios-...` / `android-...` feedback |
| AT-FB-009 | Blank feedback text | Stored as platform only (`web`, `ios`, or `android`) |
| AT-FB-010 | Feedback over max length | Trimmed to 191 characters |

## Commands

```bash
npm run test -- src/server/api/ai-tutor/__tests__
```
