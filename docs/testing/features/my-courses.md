# My Programs listing (`/my-programs`)

Last updated: 2026-08-12

## Scope

Rebuild of the old LMS's `/my-lectures` page (`experience-ui/apps/student-experience/src/pages/lectures/Learn.tsx`),
the "My Programs" destination in the profile menu. Full old-vs-new audit —
including which of the old LMS's three course-listing pages is live and which
are dead — is in `docs/my-courses-listing-migration.md`.

### Routes

`/my-programs` is canonical — it matches the page heading and the nav label.
Two aliases redirect to it (`replace`, search params preserved) so no stale link
404s:

| Path | Why it exists |
| --- | --- |
| `/my-programs` | The page. |
| `/my-courses` | The working name during the rebuild; still what `legacyPathMap` and any early bookmark use. |
| `/my-lectures` | The OLD LMS's path for this page. Only reached here if someone swaps the domain on a legacy link — the outbound hand-off for opted-out students happens earlier, in the protected layout's `beforeLoad`, and targets the old app's origin, so there is no loop. |

Deep links under the aliases (`/my-lectures/batchId/123`) are **not** caught —
neither app ever served those paths on this origin.

### API

One REST endpoint, `GET /api/courses` (route → `getMyCourses.handler` →
`getMyCourses.service`, Drizzle query builder), returning two lists:

- **`active`** — every batch from `getBatchIdsForEnrolledUser` (already
  portal-scoped and cancelled-excluded), newest enrolment first, mapped to
  `{ batchId, courseTitle, instituteName, courseLogo, courseProgress, showBatchDetails }`.
- **`cancelled`** — batches flagged `enrolmentCancelled` in
  `getUserBatchRestrictions`, intersected with the user's `section_user` batches
  so a stray restriction row can't surface a program they were never in.

Behaviour deliberately carried over from the old LMS:

- `courseProgress` is **elapsed-time** over `meta.courseTimeline`
  (`(now − first) / (last − first)`, clamped 0–100), not milestone-count. The
  already-shipped course detail page (`getCourseBatchData.service.ts`) was
  changed to use the same shared `computeCourseProgress` helper so the listing
  and `CourseHeroCard` can never report different numbers for one program.
- A batch **without** `settings.showBatchDetails` renders an **inert** card —
  no progress bar, no CTA, not a link, no GTM event. There is no detail page to
  send it to.
- Cancellation dates are `batch_user.meta` values whose shape varies by writer
  (IST wall-clock vs UTC instant); `formatRestrictionDate` handles both and
  returns `null` rather than "Invalid Date".

Improvements over the old page: skeleton instead of a spinner, a real empty
state and error state (the old page had neither), semantic theme tokens
throughout (the old cards hardcode `bg-[#fff]` / `text-gray-900` / `bg-green-100`),
an accessible `role="progressbar"`, whole-card link target, an icon-tile logo
fallback (incl. `onError`), `data-testid` on every element, GTM on every click,
and the cancelled list collapsing past 3 entries so it can't bury active programs.

## Test files

| File | Covers |
| --- | --- |
| `src/server/api/course/__tests__/courseMeta.test.ts` | Shared meta readers + `computeCourseProgress`: ordering-independence, 0/100 clamps and boundaries, no-timeline / single-milestone / zero-span / unparseable-date → 0, title & institute fallbacks, timeline key aliases |
| `src/server/api/courses/__tests__/getMyCourses.service.test.ts` | Newest-first ordering, meta fallbacks, cancelled list + date, batch in both lists shown only under cancelled, restriction rows for never-enrolled batches ignored, paused/agreement-banned not treated as cancelled, missing/soft-deleted batch rows dropped, no-programs short-circuit |
| `src/server/api/courses/__tests__/getMyCourses.handler.test.ts` | 200 shape, 401 passthrough, unexpected failure → `SERVER_ERROR_FETCHING_MY_COURSES` (500) |
| `src/lib/api/courses/coursesApi.test.ts` | `fetchMyCourses` hits `/api/courses` |
| `src/utils/formatRestrictionDate.test.ts` | IST wall-clock (no drift), wall-clock with time, UTC instant on the IST calendar incl. the day-rollover case, blank/null/undefined/unparseable → `null` |
| `src/components/features/my-courses/MyCourseCard.test.tsx` | Content render, whole-card link to `/course/$batchId`, accessible progressbar, GTM payload, inert card when `showBatchDetails` is false (and no event fired), logo fallback for null src **and** `onError`, 0% bar |
| `src/components/features/my-courses/CancelledCoursesSection.test.tsx` | Hidden when empty, uncollapsed below threshold, collapse + expand + re-collapse with GTM on each transition, date omitted when missing/unparseable, greyed logo, fallback tile |
| `src/components/features/my-courses/MyCoursesPage.test.tsx` | Skeleton → grid, mixed linked/inert cards, empty state, cancelled-only (no empty state), cancelled section hidden when none, error state |
| `src/routes/(protected)/_layout/__tests__/programListingAliases.test.ts` | `/my-courses` and `/my-lectures` each redirect to `/my-programs` with `replace` and preserved search params; `/my-programs` itself serves the page with no loader |
| `src/utils/legacyPathMap.test.ts`, `src/utils/__tests__/legacyPathMap.test.ts` | `/my-programs[/…]` and the `/my-courses[/…]` alias both hand off to the old LMS's `/my-lectures[/…]`; near-miss paths (`/my-programs-archive`, `/my-coursesx`) are left alone |

## Commands

```bash
npx vitest run src/server/api/courses src/server/api/course/__tests__/courseMeta.test.ts \
  src/components/features/my-courses src/lib/api/courses \
  src/utils/formatRestrictionDate.test.ts
npm run lint
npm run check:contrast
```

## Manual verification performed

- `/my-programs`, `/my-courses` and `/my-lectures` all return `200` for a
  session'd student. The alias redirect resolves **client-side after hydration**,
  not as an HTTP 30x — the repo's existing redirect routes
  (`lectures_/$lectureId` via `loader`, `masaiverse/index` via `beforeLoad`)
  behave the same way, so this matches the established convention rather than
  being specific to these routes. The redirect target itself is asserted in
  `programListingAliases.test.ts`; the post-hydration landing was not confirmed
  in a browser (tools unavailable).
- `GET /api/courses` unauthenticated → `401 UNAUTHORIZED`.
- `GET /api/courses` with a session for a real multi-batch student on the shared
  dev RDS → `200` with a populated `active` entry
  (`courseTitle`/`instituteName`/`courseProgress`/`showBatchDetails`).
- The cancelled-enrolment branch was **not** exercised against a live database —
  finding a cancelled row requires a full JSON scan of `batch_user` on a shared
  RDS. It is covered by unit tests only. The `discussions-cancelled-enrollment`
  seed flow would exercise it, but seeding writes and the local `DATABASE_URL`
  points at a shared remote RDS.
- Browser-pane visual QA (light + dark theme, 320px width) was **not** run —
  the browser tools were unavailable in the authoring session. `npm run check:contrast`
  passes and the page uses only semantic tokens, but a human should eyeball
  `/my-programs` in Default and a dark theme before release.

## Not covered / follow-ups

- `/my-programs` is **not** added to `isMigratedRoute()`, so with the legacy
  redirect enabled students still land on the old `/my-lectures`. Flipping it
  needs a matching `isMigratedPath` change in
  `experience-ui/apps/student-experience`.
- No e2e (`agenthand`) flow yet; the `data-testid` hooks listed in the migration
  doc are in place for one.
