# Admissions webhooks (create / cancel enrolment + batch events)

## Scope

- Routes: `src/routes/api/webhooks/admissions/{create-enrolment,cancel-enrolment,events}.ts`
- Handlers: `src/server/api/webhooks/admissions/handlers/**`
- Services: `createEnrolment.service.ts`, `cancelEnrolment.service.ts`, `events.service.ts`
- Per-event appliers: `steps/applyTransferEvent.ts`, `steps/applyAdmissionDataEvent.ts`
- Cache invalidation: `src/server/batches/portalEnrollmentCache.ts`

## Behavior

- `create-enrolment` / `cancel-enrolment` require `x-api-key` (`ADMISSIONS_API_KEY`); `events` is currently unauthenticated by design.
- `events` dispatches on the envelope `type`: `lms.batch.paid`, `lms.batch.transfer.{considered,rejected,completed}`, `lms.invoice.generated`, `lms.fee.deadline.updated`, `lms.batch.pause`, `lms.batch.unpause`. Every event locates the `batch_user` by `data.enrolment_id` (404 `ENROLMENT_NOT_FOUND`) and appends the whole envelope to the audit trail.
- **Redis invalidation:** after (and only after) the transaction commits, each service calls
  `invalidatePortalEnrollmentCache(userId)`, deleting `enrolledBatchIds:{userId}:{masai|ihub}`
  and `enrolledSectionIds:{userId}:{masai|ihub}`. Both portals are cleared because the key is
  portal-scoped. Without this, `getBatchIdsForEnrolledUser` keeps serving the pre-write set —
  including the restriction flags pause/unpause/cancel flip — for up to `ENROLLMENT_CACHE_TTL_SECONDS` (1h).
- Invalidation is unconditional per event rather than a per-event allowlist, and never throws
  (`cacheDel` degrades to a no-op when Redis is disabled or unreachable), so a Redis outage
  cannot fail a webhook.

## Test cases

| ID | Case | Expected |
|----|------|----------|
| ADM-001 | `create-enrolment` with mixed valid/invalid sections | Enrols into valid sections, reports invalid ones, returns `{ userId, batchUserId, validSectionIds, invalidSectionIds }` |
| ADM-002 | `create-enrolment` with `new_user_journey: true` | `upsertAdmissionData` called inside the transaction |
| ADM-003 | `create-enrolment` audit payload | Plaintext `password` stripped |
| ADM-004 | `create-enrolment` success | `invalidatePortalEnrollmentCache(userId)` called once after commit |
| ADM-005 | `create-enrolment` with no valid section | 422 `NO_VALID_SECTIONS`, no user resolution, no invalidation |
| ADM-006 | `cancel-enrolment` success | Batch user + its section users cancelled; `invalidatePortalEnrollmentCache(userId)` called |
| ADM-007 | `cancel-enrolment` unknown enrolment | Throws; cache untouched |
| ADM-008 | Each `events` type (paid / pause / unpause / invoice / fee deadline) | Correct step invoked and `invalidatePortalEnrollmentCache(userId)` called |
| ADM-009 | `events` lookup failure | Throws; cache untouched |
| ADM-010 | Transfer events (considered / rejected / completed) | Correct `status` + `payloadType` recorded; missing `to_batch_id` → 400 `INVALID_ENROLMENT_PAYLOAD` |
| ADM-011 | `lms.invoice.generated` / `lms.fee.deadline.updated` without their value | 400 `INVALID_ENROLMENT_PAYLOAD`, no write |

## Commands

- `npm run test -- src/server/api/webhooks/admissions`
- `npm run test -- src/server/batches`
