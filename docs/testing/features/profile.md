# Profile page (`/profile`)

## Scope

- Route: `src/routes/(protected)/_layout/profile/index.tsx` (`?tab=` via `validateSearch`)
- API routes: `src/routes/api/profile/**`
- Handlers: `src/server/api/profile/handlers/**`
- Services: `src/server/api/profile/*.service.ts` + `parseUserAgent.ts`, `badgeShareKey.ts`, `badgeLandingUrl.ts`
- Client: `src/lib/api/profile/{profileApi,profilePaths}.ts`, `src/query/profile/profileQueries.ts`
- Pure rules: `src/lib/profile/{validateMobile,validatePassword,captureSigningContext}.ts`
- UI: `src/components/features/profile/**`
- Shared extract: `src/server/storage/s3ToCloudFront.ts` (badge images + lecture video, previously duplicated inside `resolveLectureVideoUrl.ts`)
- Seed flow: `seed/flows/profile-page/**` (+ `createBadge`/`createBadgeConfig`/`createUserBadge`/`createSession` factories)

Rebuilt from the old LMS's `NewProfileMain.tsx`; see `docs/profile/old-lms-audit.md`
for what was live there and `docs/profile/rebuild-plan.md` for what was deliberately
dropped.

## Behavior

- **Tabs** are derived from two admission flags on `GET /api/profile`, so the tab
  list resolves in one round trip: Student Kit needs `hasFullFees && isNewUserJourney`,
  My Invoices needs `isNewUserJourney`. Certificates is now always present (the old
  build-time `CERTIFICATE_VIEW` gate is gone), and "acknowledgement" is
  "Acknowledgements". An unknown or now-inaccessible `?tab=` falls back to Profile Details.
- **Each tab owns a lazily-`enabled` query**, so opening the page costs one request
  rather than eight.
- **Identity is session-only.** `PATCH /api/profile` and `PUT /api/profile/password`
  take no user id — the legacy mutations accepted one from the client.
- **Sessions**: `DELETE /api/profile/sessions` keeps the caller's own session alive
  (the old "sign out of all devices" logged you out of the tab you clicked in), and
  revoking the current session is refused with 409. The always-`null` `location`
  field the old resolver returned is dropped rather than reproduced.
- **Acknowledgements**: geolocation + IP are captured on **Accept**, not on tab
  mount, and a denial produces a retryable message. Acceptance is written to
  `profiles.legal_data.undertakings.section_{id}` after re-checking enrolment.
- **Email preferences** live on `profiles.meta.email_notifications` (no table),
  default to all-on, and preserve the `messages` / `app_download_reminder` keys this
  UI does not expose. Both directions still confirm, matching the old LMS.
- **Achievements** list every `badge_configs` row on the student's enrolled
  sections — that is what makes *locked* badges visible — collapsing duplicate
  `user_badges` awards per config into a count with the earliest unlock date.
  Share links point at experience-api's OG landing page and require
  `BADGE_SHARE_SECRET` (or `JWT_SECRET`); with neither set the key is `null` and the
  UI shares text only rather than emitting a link the API would reject.
- **Certificates** fan out over the existing `getCourseCertificates` service per
  enrolled batch, so the profile and course pages can't disagree.
- **Student Kit / Invoices** proxy the Admissions API (`include=kit` / `invoices`);
  both degrade to an empty/awaiting state when it is unreachable.
- **Avatar upload** is a deliberate addition (the old page had no affordance),
  reusing `POST /api/dashboard/profile-photo`.

## Test cases

| ID       | Case                                                                  | Expected                                                                        |
| -------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| PRF-001  | Tab gating for a plain student                                         | 5 always-on tabs; no Student Kit, no Invoices                                    |
| PRF-002  | `hasFullFees` without `isNewUserJourney`                               | Student Kit stays hidden                                                        |
| PRF-003  | Both admission flags set                                              | Student Kit appears second, Invoices appears                                     |
| PRF-004  | `?tab=invoices` for an ineligible student                             | Falls back to `details`                                                         |
| PRF-005  | Tab click                                                             | Navigates to `/profile?tab=<id>` and fires `l_profile_tab_click`                 |
| PRF-006  | Overview for a user with no `profiles` row                            | Resolves (does not throw as the legacy query did); phone `null`                  |
| PRF-007  | Student codes                                                         | From `batch_user` + batch name; `users.username` only as last resort             |
| PRF-008  | Avatar source precedence                                              | `profiles.meta.profile_pic` → `users.profile_photo_path` → initials              |
| PRF-009  | Name save                                                             | Trimmed; blank/over-long rejected client- and server-side                        |
| PRF-010  | Phone rules                                                           | Leading 6/7/8/9 ⇒ exactly 10 digits; else 7–15; digits-only input; hint shown    |
| PRF-011  | Password change                                                       | Verifies current password; ≥8 chars, no spaces, must match; refuses a reuse      |
| PRF-012  | Wrong current password                                               | 400 `INCORRECT_CURRENT_PASSWORD`, named in the UI                               |
| PRF-013  | One-editor-at-a-time                                                  | Other cards get `aria-disabled` + `pointer-events-none` (not just 45% opacity)   |
| PRF-014  | Session list                                                          | UA humanised; caller's row flagged `isCurrent` with no revoke button             |
| PRF-015  | Revoke another session                                                | Confirms first; ownership-checked; 404 for someone else's id                     |
| PRF-016  | Revoke own session                                                    | 409 `CANNOT_REVOKE_CURRENT_SESSION`                                             |
| PRF-017  | Sign out of other devices                                             | Current session survives, and the dialog says so; count pluralised               |
| PRF-018  | Email preference defaults                                             | All six on when meta is absent/garbage                                          |
| PRF-019  | Email preference write                                                | Confirms both directions; preserves other meta keys; rolls back on failure       |
| PRF-020  | Pending acknowledgements                                              | Only active enrolled sections with a visible template + PDF, minus accepted      |
| PRF-021  | Accept an acknowledgement                                             | Prompts for location only on Accept; stamps IP + address; enrolment re-checked   |
| PRF-022  | Location denied / timeout                                             | Retryable message, dialog stays open, nothing submitted                         |
| PRF-023  | Achievements grouping                                                 | Program → module, earned before locked, `xN` for repeats, earliest unlock date   |
| PRF-024  | Badge share                                                           | Landing URL when configured, text-only when not; never an invalid key            |
| PRF-025  | Certificates across batches                                           | Concatenated; a failing batch is skipped, not fatal                              |
| PRF-026  | Student Kit states                                                    | Admissions CTA → submitted/awaiting → tracking id + link                         |
| PRF-027  | Invoice amounts                                                       | Numeric and comma-string amounts parsed; junk → `null`; `₹` en-IN formatting     |
| PRF-028  | Empty states                                                          | Every tab has friendly copy — none render blank as the old page did              |
| PRF-029  | Error states                                                          | Each tab surfaces a `role="alert"` notice on fetch failure                       |
| PRF-030  | Avatar upload                                                         | Rejects non-images and >5 MB before upload; announces progress and failure       |
| PRF-031  | Unauthenticated access                                                | Every handler 401s                                                              |

## Test files

- Services: `src/server/api/profile/__tests__/*.test.ts`
- Handlers: `src/server/api/profile/handlers/__tests__/*.test.ts`
- Pure rules: `src/lib/profile/*.test.ts`
- Client layer: `src/lib/api/profile/profileApi.test.ts`, `src/query/profile/profileQueries.test.ts`
- UI: `src/components/features/profile/**/*.test.tsx`, `profileTabsConfig.test.ts`, `achievements/groupAchievements.test.ts`
- Shared extract: `src/server/storage/__tests__/s3ToCloudFront.test.ts`

## Commands

```bash
npm run test -- src/components/features/profile src/server/api/profile src/lib/profile
npm run lint
npm run check:contrast
npm run seed profile-page -- --no-reset   # needs a LOCAL dev DATABASE_URL
```

## Notes / gaps

- `npm run seed profile-page` was **not executed** during this change: the local
  `DATABASE_URL` points at a shared remote RDS, and the seed framework is only
  safe against a local dev database.
- Student Kit and My Invoices contents depend on the external Admissions API, so
  the seed flow only unlocks those tabs; their payloads are covered by unit tests
  with the client mocked.
- Badge share links need `BADGE_SHARE_SECRET` (or `JWT_SECRET`) in this app's env;
  neither is currently set locally, so sharing degrades to text-only.
- The repo has no coverage provider installed (`@vitest/coverage-v8` is absent),
  so the 100% target could not be machine-verified; every new module has a
  colocated test instead.
