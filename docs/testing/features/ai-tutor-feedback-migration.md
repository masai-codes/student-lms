# AI Tutor chat feedback rating migration

Last updated: 2026-07-09

## Scope

- `POST /api/ai-tutor/chat/feedback/migrate-ratings` — one-off admin migration for legacy `ai_chat_practice_questions.rating` values.

## Rules

1. Load every `ai_chat_practice_questions` row where `rating` is not null.
2. If `feedback` has an `ios` or `android` prefix (`ios`, `android`, `ios-...`, `android-...`), subtract `1` from the stored rating. Rows that would drop below `1` are skipped and reported in `skippedRows`.
3. Else, if `rating` is `0` or `1` and `feedback` has no platform prefix (`ios`, `android`, `web`, `web-mobile`, `web-desktop`, `app`), convert `0 → 1` and `1 → 5`.
4. All other rows are left unchanged.

## Request body

```json
{
  "dryRun": true
}
```

`dryRun` defaults to `false`. When `true`, the API reports what would change without writing updates.

## Response

```json
{
  "dryRun": true,
  "scanned": 12,
  "updated": 8,
  "unchanged": 3,
  "skipped": 1,
  "changes": [{ "id": 4, "previousRating": 6, "rating": 5 }],
  "skippedRows": [{ "id": 9, "rating": 1, "reason": "MOBILE_RATING_BELOW_MIN" }]
}
```

## Auth

- Requires a signed-in admin (`admin` or `super_admin` role).
- Non-admins receive `403 AI_TUTOR_MIGRATION_FORBIDDEN`.

## Commands

```bash
npm run test -- src/server/api/ai-tutor/__tests__/migrateFeedbackRating.test.ts src/server/api/ai-tutor/__tests__/migrateAiTutorFeedbackRatings.service.test.ts src/server/api/ai-tutor/__tests__/migrateFeedbackRatings.handler.test.ts
```
