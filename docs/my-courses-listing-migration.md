# My Programs (course listing) — old LMS analysis & new LMS rebuild plan

Scope: rebuild the student-facing **course/program listing** page in `student-lms`
at `/my-programs`. The **course detail** page is already rebuilt
(`/course/$batchId` → `CoursePage`); this document covers the listing only.

---

## 1. Locating the real page in the old LMS

The old LMS has **three** things that look like a course listing. Only one is live.

| Route | Component | Status | Verdict |
| --- | --- | --- | --- |
| `/my-lectures` | `pages/lectures/Learn.tsx` (exported as `MyLectures`, imported as `Try`) | **LIVE** — target of the "My Programs" profile-menu item (`profileMenuOptions.ts` → `Routes.lectures.main()`) | ✅ **This is the page to rebuild** |
| `/new-courses` | `pages/NewMyCourses/Courses.tsx` | Reachable by URL only. Nothing links to it. Its header is commented out and the grid is `absolute top-[165px]` under a header that no longer renders — visually broken. | ❌ Dead. Do not rebuild. |
| `/my-courses` | `pages/MyCourses/index.tsx` | A **sections** listing (search + active/inactive + pagination), not a program listing. Not linked from nav. Uses `getCurrentUserSections`. | ❌ Out of scope. Different entity (sections, not batches). |

Confirmation from the new LMS side: `src/utils/legacyPathMap.ts` already maps
`/my-courses → /my-lectures`, i.e. the new listing route is the declared
successor of old `/my-lectures`. The nav item already exists
(`useAppNavItems.tsx`, id `courses`, label **"My Programs"**, icon `GraduationCap`).

---

## 2. What `/my-lectures` actually does (live behaviour only)

### Data

Two GraphQL queries:

1. `getUserBatchesWithShowBatchDetails(userId)` → `[{ id, name, meta, settings }]`
   - Resolver (`experience-api/src/features/batch/resolver.ts:864`):
     `section_user` → `sections.batch_id`, ordered by `section_user.id DESC`,
     deduped (latest enrolment first), then filtered by portal
     (`allowedBatchIds`, iHub vs Masai).
   - ⚠️ The `settings.showBatchDetails === true` filter that the query name
     implies is **commented out** in the resolver — every enrolled batch is
     returned. The flag is only used client-side to gate the progress bar + CTA.
   - ⚠️ The resolver does **not** exclude cancelled enrolments; the REST
     controller (`batch.controller.ts:1017`) does. The page compensates client-side.
2. `getUserCancelledEnrolmentBatches(userId)` → cancelled batches, each with
   `enrolmentCancelledDate`.

Client then computes `activeBatches = allBatches − cancelledBatchIds`, because
cancelling an enrolment does not always remove `section_user` rows, so a
cancelled batch can appear in both lists.

### UI

- Heading **"My Programs"** (mobile: centered, with a `window.history.back()`
  chevron on the left; desktop: left-aligned, no chevron).
- Loading: a centered flowbite `<Spinner />` over `min-h-screen`.
- Active grid: `grid-cols-1 md:grid-cols-2`, gap 4/6. Each card
  (`MyCourseCard.tsx`) is a bordered white 16px-radius box, `p-16px`:
  - `meta.courseLogo` image, 40px mobile / 56px desktop (fallback: Masai logo).
  - `h3` = `meta.courseTitle || batch.name`.
  - `by {meta.instituteName || 'Masai'}`.
  - **Only when `settings.showBatchDetails === true`:**
    - green progress bar (track `bg-green-100`, fill `bg-green-400`, 10px, r-24)
    - below it: `Program Progress` (left) and `{n}%` (right)
    - bottom-right CTA `Program Details` → `/new-courses/{batch.id}`
  - When `showBatchDetails` is false the card is **completely inert** — no
    progress, no CTA, not clickable. (UX gap; see §5.)
- Cancelled section, only when non-empty:
  - heading **"Cancelled Enrolments"**
  - copy: "Your enrolment in these programs has been cancelled, so the program
    content is no longer available."
  - same 1/2-col grid of `CancelledCourseCard.tsx`: grayscale logo at 60%
    opacity, muted title/institute, a red pill **"Enrolment cancelled"** and,
    when parseable, `on {d MMM yyyy}`.
- **No empty state** when the student has zero batches — the page renders just
  the heading. (UX gap; see §5.)

### Progress calculation (`calculateProgress` in `Learn.tsx`)

Elapsed-time between the first and last `meta.courseTimeline[].timeLine` date:

```
progress = clamp(0, 100, round((now - firstDate) / (lastDate - firstDate) * 100))
```

Note this is **not** the formula the new LMS course *detail* page uses.
`getCourseBatchData.service.ts` uses `completedMilestones / totalMilestones`.
Showing two different numbers for the same program on two adjacent screens is a
bug in waiting — see §5.

---

## 3. Dead / stale code in the old page — explicitly NOT being rebuilt

| Thing | Why it's dead |
| --- | --- |
| `useGetCurrentUserSectionsQuery` in `Learn.tsx` (`per_page: 500`) | Result assigned to `data`/`isLoading` and **never read**. A wasted 500-row query on every page load. |
| `import { courseData } from '../NewMyCourses/data'` | Mock fixture (hardcoded "Udit Bhatia", fake evaluations, fake admit cards). Imported, never used. Same import is dead in `NewMyCourses/Courses.tsx`. |
| `HeaderCard` ("Learn" hero with a peach→violet gradient) | Imported, entirely commented out. |
| ~120 lines of card markup inside `<div className="... hidden">` in `Learn.tsx` | Literally `hidden`. Superseded by `MyCourseCard`. Includes an older purple-gradient progress bar and a desktop/mobile split layout. |
| `handleCourseClick` / `/my-lectures/batchId/:id` | Passed into `MyCourseCard` as a prop and never invoked there. The "Start Learning" button that used it is commented out. |
| `hasDetailsInRow(index)` | Passed in, called with a hardcoded `index = 0`, and both branches return `''`. No-op. |
| `NewMyCourses/data.ts` | Pure mock data for the whole NewMyCourses tree. |
| `/new-courses` listing, `/my-courses` sections listing | See §1. |

**Net live surface: one heading, one card type, one cancelled card type, one
progress number, one CTA.** Everything else is scaffolding.

---

## 4. What already exists in the new LMS (reuse, don't rebuild)

| Need | Already there |
| --- | --- |
| Route shell | `src/routes/(protected)/_layout/my-courses.tsx` — currently `return null` ("blank slate — being rebuilt"); the rebuilt page lives at `/my-programs`, with `/my-courses` and `/my-lectures` redirecting to it |
| Nav entry | `useAppNavItems.tsx` → `{ id: 'courses', to: '/my-programs', label: 'My Programs' }` |
| Detail page | `/course/$batchId` → `CoursePage` (already migrated) |
| Enrolled batch IDs, portal-scoped, cancelled-excluded, Redis-cached | `getBatchIdsForEnrolledUser()` |
| Batch row → `{ batchId, courseTitle, courseLogo, showBatchDetails, … }` | `mapEnrolledBatchRow()` / `getEnrolledBatchesForUser()` |
| Cancellation flags + dates | `getUserBatchRestrictions()` → `BatchRestrictionFlags.enrolmentCancelled` / `enrolmentCancelledDate` |
| Progress from `courseTimeline` | `getCourseBatchData.service.ts` (milestone-based) |
| REST plumbing | `jsonOk` / `mapThrownErrorToResponse` / `requireSessionUserId` / `fetchJson` |
| Page gutters | `<main class="layout-page">` in the protected layout — the page must **not** add its own `px-*`/`mx-*` |
| Motion kit, theme tokens, skeletons, GTM helper | `styles.css` `dash-*`, semantic tokens, `dash-skeleton`, `pushGtmEvent` |

**Gap:** `mapEnrolledBatchRow` does not expose `instituteName`, `courseImage`, or
progress — the listing needs those. And there is no listing REST endpoint yet.

---

## 5. Deliberate UX improvements over the old page

Same visual language, better behaviour. Each is a fix for a concrete defect above.

1. **Whole card is the link, not just a small CTA.** Old page: a 14px text link
   in the bottom-right corner is the only tap target on a ~200px card.
   New: when `showBatchDetails` is true the whole card is an `<a>` to
   `/course/{batchId}`, with `dash-lift` + `hover:border-brand/35`, and the
   "Program Details" CTA stays as an explicit affordance.
2. **Inert cards stay inert** *(decided)*. When `showBatchDetails` is false the
   card renders logo + title + institute only, with no progress bar, no CTA and
   no click target — exact old-LMS parity. It is rendered as a plain `<div>`, not
   a disabled link, so nothing advertises an interaction that doesn't exist.
3. **One progress number across the product** *(decided: elapsed-time)*. Both
   surfaces use the old listing's formula —
   `clamp(0, 100, round((now − firstDate) / (lastDate − firstDate) × 100))` over
   `meta.courseTimeline[].timeLine`. It is computed **server-side** in one shared
   helper. This means changing the already-shipped course *detail* page, which
   currently uses `completed / total`, so the listing and `CourseHeroCard` agree.
4. **A real empty state.** `animate-dash-float` icon + "No programs yet" +
   a line pointing at support. Old page rendered a bare heading.
5. **Skeleton instead of a spinner.** `dash-skeleton` cards mirroring the real
   grid, per the design system.
6. **Cancelled section collapsed by default** when there are ≥3 cancelled
   entries, so a long cancellation history doesn't bury active programs.
7. **Full theming + a11y.** Old cards are hardcoded `bg-[#fff]`, `text-gray-900`,
   `bg-green-100`, `text-red-700` — unreadable in dark themes. New cards use
   semantic tokens only, `role="list"`/`listitem`, and a real
   `<progress>`-equivalent with `aria-valuenow`.
8. **`data-testid` + GTM on everything** — neither exists on the old page.
9. **Drop the mobile `history.back()` chevron.** `/my-programs` is a top-level
   nav destination reached from the profile menu; a back chevron on a root page
   is a dead end when it's the first page loaded. The mobile tab bar/nav is the
   way back.

---

## 6. Implementation plan

### 6.1 Server (REST, Drizzle query builder)

**`src/server/api/courses/getMyCourses.service.ts`** (new)

```ts
export interface MyCourseListItem {
  batchId: number
  courseTitle: string      // meta.courseTitle || batches.name
  instituteName: string    // meta.instituteName ?? meta.institute ?? meta.collegeName, default 'Masai'
  courseLogo: string | null
  courseProgress: number   // milestone-based, 0 when no timeline
  showBatchDetails: boolean
}

export interface CancelledCourseListItem {
  batchId: number
  courseTitle: string
  instituteName: string
  courseLogo: string | null
  cancelledOn: string | null   // ISO or IST wall-clock, formatted client-side
}

export interface MyCoursesData {
  active: MyCourseListItem[]
  cancelled: CancelledCourseListItem[]
}
```

- `active`: `getBatchIdsForEnrolledUser(userId)` (already portal-scoped and
  cancelled-excluded) → one `db.select` on `batches`, ordered newest-enrolment-first
  to match `/learn`.
- `cancelled`: `getUserBatchRestrictions(userId)` → batch IDs with
  `enrolmentCancelled`, intersected with the user's `section_user` batches so we
  never show a batch they were never in, → same `batches` select.
- Extract the shared `meta`-parsing (`courseTitle`/`instituteName`/`courseLogo`/
  timeline progress) into **`src/server/api/course/courseMeta.ts`** and have
  `getCourseBatchData.service.ts` consume it too — that's what guarantees §5.3.
  Keep each file under 200 lines.

**Handler** `src/server/api/courses/handlers/getMyCourses.handler.ts` —
`requireSessionUserId()` → service → `jsonOk`; catch → `mapThrownErrorToResponse`.
Add `SERVER_ERROR_FETCHING_MY_COURSES` → 500 to `responses.ts`.

**Route** `src/routes/api/courses/index.ts` → `GET /api/courses`.

**Client** `src/lib/api/courses/coursesPaths.ts` (`MY_COURSES_API.list`) +
`coursesApi.ts` (`fetchMyCourses()` via `fetchJson`).

### 6.2 UI

```
src/components/features/my-courses/
  MyCoursesPage.tsx          // query + layout + sections   (~110 lines)
  MyCourseCard.tsx           // active program card
  CancelledCourseCard.tsx    // cancelled program card
  MyCoursesEmptyState.tsx
  MyCoursesSkeleton.tsx
  myCoursesAnalytics.ts      // pushGtmEvent wrapper, prefix l_my_courses_
```

- `my-courses.tsx` route renders `<MyCoursesPage />`.
- `useQuery({ queryKey: ['my-courses'], queryFn: fetchMyCourses, staleTime: 5min })`.
- Grid `grid-cols-1 md:grid-cols-2 gap-4 md:gap-6`; no page gutters (layout owns them).
- Entrance: `animate-dash-rise` on sections, `animate-dash-row-in` on cards with
  `--dash-delay: Math.min(i, 8) * 0.05s`.
- Tokens only: `bg-surface`, `border-border`, `text-foreground`,
  `text-foreground-muted`; progress track `bg-success-subtle` + fill `bg-[#31C48D]`
  (matching `CourseHeroCard`); cancelled pill `bg-danger-subtle` /
  `text-danger-subtle-foreground`.
- Logo fallback: `GraduationCap` from `@phosphor-icons/react` in a
  `bg-brand-subtle` rounded tile — no remote fallback image URL.
- Cancellation date formatting: port `formatCancelledDate` (IST wall-clock vs
  UTC instant) into `src/utils/` next to the existing date helpers and unit-test it.

**Test IDs:** `my-courses-page`, `my-courses-grid`, `my-courses-card-<batchId>`,
`my-courses-card-title-<batchId>`, `my-courses-card-progress-<batchId>`,
`my-courses-card-details-cta-<batchId>`, `my-courses-cancelled-section`,
`my-courses-cancelled-card-<batchId>`, `my-courses-empty-state`,
`my-courses-skeleton`.

**GTM:** `l_my_courses_card_click_id_<batchId>`,
`l_my_courses_details_cta_click_id_<batchId>`,
`l_my_courses_learn_cta_click_id_<batchId>`,
`l_my_courses_cancelled_section_toggle` — all with
`{ batchId, courseTitle, showBatchDetails, source: 'my-courses' }`, fired
synchronously before navigation.

### 6.3 Route enablement

Add `/my-programs` to `isMigratedRoute()` **only when we're ready to cut over** —
until then the legacy redirect keeps sending opted-out students to
`/my-lectures`. Flag this as an explicit release step, with the matching
`isMigratedPath` update on the old-LMS side (they must stay in sync or the two
apps ping-pong).

### 6.4 Tests (vitest + Testing Library, written in the same PR)

- `getMyCourses.service.test.ts` — active list, cancelled list, batch in both
  lists appears only under cancelled, zero enrolments, missing `meta.courseTitle`
  falls back to `batches.name`, missing institute falls back to `Masai`, empty
  timeline → 0%.
- `courseMeta.test.ts` — progress formula boundaries (no timeline, all past,
  all future, unparseable dates).
- `getMyCourses.handler.test.ts` — 200 shape, 401 unauthenticated, 500 mapping.
- `MyCoursesPage.test.tsx` — skeleton → grid, empty state, cancelled section
  hidden when empty and shown when not, card links to `/course/:id` when
  `showBatchDetails` and `/learn?batchId=` when not, GTM fired on click.
- `MyCourseCard.test.tsx` / `CancelledCourseCard.test.tsx` — progress bar hidden
  when `showBatchDetails` is false, logo fallback, date formatting incl. the
  unparseable case.
- Docs: new `docs/testing/features/my-courses.md`, row added to
  `docs/testing/feature-test-matrix.md`, `docs/testing/pr-checklist.md` completed.
- Gates: `npm run test`, `npm run lint`, `npm run check:contrast`; eyeball
  `/theme-lab` + the page in Default and a dark theme.

---

## 7. Decisions taken

1. **Progress formula → elapsed-time**, matching the old LMS listing. The course
   *detail* page's milestone-based calculation is changed to match, via the
   shared `computeCourseProgress` helper.
2. **`showBatchDetails === false` cards stay inert**, exactly as in the old LMS.
3. **No cut-over in this change.** `/my-programs` is fully built and reachable,
   but `isMigratedRoute()` is left untouched, so opted-out students still
   redirect to `/my-lectures`. Flipping it later requires the matching
   `isMigratedPath` change in `experience-ui/apps/student-experience`.
