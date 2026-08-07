# Admissions webhooks (create / cancel enrolment + batch events)

## Scope

- Routes: `src/routes/api/webhooks/admissions/{create-enrolment,cancel-enrolment,events}.ts`
- Handlers: `src/server/api/webhooks/admissions/handlers/**`
- Services: `createEnrolment.service.ts`, `cancelEnrolment.service.ts`, `events.service.ts`
- Per-event appliers: `steps/applyTransferEvent.ts`, `steps/applyAdmissionDataEvent.ts`
- Portal meta defaults: `steps/applyPortalNewLmsDefaults.ts` (+ meta keys in `src/server/api/profile/newLmsPreference.service.ts`)
- Cache invalidation: `src/server/batches/portalEnrollmentCache.ts`

## Behavior

- `create-enrolment` / `cancel-enrolment` require `x-api-key` (`ADMISSIONS_API_KEY`); `events` is currently unauthenticated by design.
- `events` dispatches on the envelope `type`: `lms.batch.paid`, `lms.batch.transfer.{considered,rejected,completed}`, `lms.invoice.generated`, `lms.fee.deadline.updated`, `lms.batch.pause`, `lms.batch.unpause`. Every event locates the `batch_user` by `data.enrolment_id` (404 `ENROLMENT_NOT_FOUND`) and appends the whole envelope to the audit trail.
- **Redis invalidation:** after (and only after) the transaction commits, each service calls
  `invalidatePortalEnrollmentCache(userId)`, deleting `enrolledBatchIds:{userId}:{portal}`,
  `enrolledSectionIds:{userId}:{portal}` and the old LMS's `allowedBatchIds:{userId}:{portal}`
  for every portal in `ENROLLMENT_CACHE_PORTALS` — the key is portal-scoped, and experience-api
  caches the same batch set under its own key name in the same Redis db (`src/utils/ihubAccess.ts`).
  Without this, `getBatchIdsForEnrolledUser` (and experience-ui) keeps serving the pre-write set —
  including the restriction flags pause/unpause/cancel flip — for up to `ENROLLMENT_CACHE_TTL_SECONDS` (1h).
- **IIT Jodhpur (new-LMS-only portal):** `create-enrolment` with `isiitj: true` resolves to
  `client: 'iitj'`, and `steps/applyPortalNewLmsDefaults.ts` then defaults that student's
  `users.meta` to `new_lms_pages_enabled: true` (migrated pages served by this app) plus
  `hide_switch_option: true` (no old↔new switch CTA in _either_ LMS — experience-ui reads the
  same key off the `me` payload's `meta`). It runs on create _and_ revive so a pre-existing iitj
  user is backfilled on their next enrolment, and only ever fills in absent keys so a deliberate
  override survives. No-op for masai / iHub. `updateNewLmsPagesPreference` also refuses to move a
  `hide_switch_option` user, so a hand-crafted API call can't strand them on the old LMS.
- Invalidation is unconditional per event rather than a per-event allowlist, and never throws
  (`cacheDel` degrades to a no-op when Redis is disabled or unreachable), so a Redis outage
  cannot fail a webhook.

## Test cases

| ID      | Case                                                                     | Expected                                                                                                                                |
| ------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| ADM-001 | `create-enrolment` with mixed valid/invalid sections                     | Enrols into valid sections, reports invalid ones, returns `{ userId, batchUserId, validSectionIds, invalidSectionIds }`                 |
| ADM-002 | `create-enrolment` with `new_user_journey: true`                         | `upsertAdmissionData` called inside the transaction                                                                                     |
| ADM-003 | `create-enrolment` audit payload                                         | Plaintext `password` stripped                                                                                                           |
| ADM-004 | `create-enrolment` success                                               | `invalidatePortalEnrollmentCache(userId)` called once after commit                                                                      |
| ADM-005 | `create-enrolment` with no valid section                                 | 422 `NO_VALID_SECTIONS`, no user resolution, no invalidation                                                                            |
| ADM-006 | `cancel-enrolment` success                                               | Batch user + its section users cancelled; `invalidatePortalEnrollmentCache(userId)` called                                              |
| ADM-007 | `cancel-enrolment` unknown enrolment                                     | Throws; cache untouched                                                                                                                 |
| ADM-008 | Each `events` type (paid / pause / unpause / invoice / fee deadline)     | Correct step invoked and `invalidatePortalEnrollmentCache(userId)` called                                                               |
| ADM-009 | `events` lookup failure                                                  | Throws; cache untouched                                                                                                                 |
| ADM-010 | Transfer events (considered / rejected / completed)                      | Correct `status` + `payloadType` recorded; missing `to_batch_id` → 400 `INVALID_ENROLMENT_PAYLOAD`                                      |
| ADM-011 | `lms.invoice.generated` / `lms.fee.deadline.updated` without their value | 400 `INVALID_ENROLMENT_PAYLOAD`, no write                                                                                               |
| ADM-012 | `invalidatePortalEnrollmentCache(7)`                                     | One `cacheDel` with `enrolledBatchIds` + `enrolledSectionIds` + legacy `allowedBatchIds` for every portal in `ENROLLMENT_CACHE_PORTALS` |
| ADM-013 | `create-enrolment` with `isiitj: true`                                   | `applyPortalNewLmsDefaults` called with `client: 'iitj'` inside the transaction; sets `new_lms_pages_enabled` + `hide_switch_option`    |
| ADM-014 | `create-enrolment` for masai / iHub                                      | `applyPortalNewLmsDefaults` receives the resolved client and no-ops — it never even reads the user row                                  |
| ADM-015 | iitj user whose meta already has one of the two flags                    | Only the absent key is filled; an explicit existing value (e.g. a support override) is preserved                                        |
| ADM-016 | iitj user whose meta already has both flags                              | No `UPDATE` issued at all                                                                                                               |

## Commands

- `npm run test -- src/server/api/webhooks/admissions`
- `npm run test -- src/server/batches`
