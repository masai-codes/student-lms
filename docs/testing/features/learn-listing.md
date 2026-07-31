# Learn listing (`/learn`)

## Scope

**Single endpoint** `GET /api/learn/page` → `getLearnPageData` → `getEnrolledBatchesForUser`

- `getBatchLearningData`. Returns everything the page renders in one round-trip:
  `{ batches, selectedBatchId, filterValues, learningItems, pagination }`. The `/learn`
  route loader is the only fetch; it re-runs on any search-param change. `batchId` is
  optional — the server defaults to the first enrolled batch (the client still passes a
  `batchId` to honour the localStorage last-batch preference).

The listing service was moved from "fetch-all + filter/paginate in memory" to
**SQL-side filtering and pagination**, split into focused modules, with legacy-LMS
behavior restored.

- **Schedule visibility (legacy):** lectures/resources default to `(−∞, now+24h)`;
  `upcoming` → `[now, now+24h)`; `past` → `(−∞, now)`; assignments cap at
  end-of-today IST. Date-range filters cap the upper bound at today.
- **Attendance filter forces mandatory-only** and matches a `student_attendances`
  row of the requested status via an `EXISTS` subquery.
- **Page size 25** (legacy `PAGE_SIZE`), `pageSize` capped at 50.
- **Facets** are stable (distinct over the batch + sections + tab scope), not
  derived from the filtered subset.
- Assignment progress status is computed in app code (derived from time +
  submission state) and applied to the SQL-narrowed set, then paginated.
- **Section ("Course") filter is opt-in per batch:** `mapEnrolledBatchRow` reads
  `batches.meta.showSectionDropdown` into `EnrolledBatch.showSectionDropdown`;
  `LearnHeaderSection` renders the section dropdown only for the selected batch when
  that flag is `true`, and `LearnLayout` clears any lingering `sectionId` (URL or
  localStorage) while the flag is off so a hidden control can't narrow the listing.
- **Join Live CTA (live/scrum cards):** `buildLearnListingCardCtas` resolves
  `joinLive`/`joinZoomLink`/`isNewZoomRedirection` plus **`enableZoomWebView`**
  (from `sections.settings` via the `sections` join in `fetchLectureListingPage`).
  The card CTA (`LearnListingJoinLiveCta`) mirrors the lecture-detail join ladder:
  ZEF redirect → **Zoom Web View** (opens the old LMS embed
  `${getOldStudentUiUrlFromEnv()}/lectures/:id/zoom` via `buildZoomWebViewUrl`) →
  raw/adaptive link. Web View is only flagged for a shown, non-adaptive, non-ZEF
  link; it falls back to the raw link when the legacy base is unresolved. Analytics
  tag `join_method`. The same builder feeds associated-item cards
  (`buildAssociatedLearningItems`) and the dashboard schedule
  (`buildDashboardScheduleItem`).

## Test files

| Area                                                        | File                                                                                                  |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Schedule window (visibility cap, date cap, IST cutoff)      | `src/server/learn/utils/__tests__/buildLearnScheduleWindow.test.ts`                                   |
| Module label → SQL predicate (week fallback)                | `src/server/learn/utils/__tests__/buildModuleFilterCondition.test.ts`                                 |
| WHERE condition builders (lectures/resources + assignments) | `src/server/learn/utils/__tests__/buildLearnListingConditions.test.ts`                                |
| Pagination envelope + clamping                              | `src/server/learn/utils/__tests__/resolveListingPagination.test.ts`                                   |
| Lecture/resource paginated query                            | `src/server/learn/queries/__tests__/fetchLectureListingPage.test.ts`                                  |
| Assignment query (progress compute + filter + paginate)     | `src/server/learn/queries/__tests__/fetchAssignmentListingPage.test.ts`                               |
| Facet queries (distinct, sorted, week/unknown fallbacks)    | `src/server/learn/queries/__tests__/fetchLearnListingFacets.test.ts`                                  |
| Service orchestration (lecture/assignment/resource mapping) | `src/server/learn/__tests__/getBatchLearningData.service.test.ts`                                     |
| Card CTA resolver (join state + Zoom Web View gate)         | `src/server/learn/utils/__tests__/buildLearnListingCardCtas.test.ts`                                  |
| Join Live CTA component (ZEF / Web View / raw / fallback)   | `src/components/features/learn/section-three/content-card/__tests__/LearnListingJoinLiveCta.test.tsx` |
| Combined page service (batches + selected batch + listing)  | `src/server/learn/__tests__/getLearnPageData.service.test.ts`                                         |
| Batch flags incl. `meta.showSectionDropdown`                | `src/server/learn/__tests__/getEnrolledBatches.service.test.ts`                                       |
| Header section-filter visibility gate                       | `src/components/features/learn/section-one/__tests__/LearnHeaderSection.test.tsx`                     |
| Page query parser (optional batchId)                        | `src/server/api/learn/utils/__tests__/parseLearnPageQuery.test.ts`                                    |
| Page endpoint handler                                       | `src/server/api/learn/handlers/__tests__/getLearnPageData.handler.test.ts`                            |

## Commands

```bash
npm run test -- src/server/learn
npm run typecheck
npm run lint
```

## Manual verification (live DB)

Unit tests mock `@/db`, so SQL/timezone correctness must be smoke-tested against a
local DB:

1. `/learn?tab=lectures&lectureTab=all` — only past + next-24h sessions appear.
2. `lectureTab=upcoming` — only the next 24h; `past` — only before now.
3. Attendance filter present/absent — only mandatory lectures with a matching
   `student_attendances` row.
4. A date range with a future end date — clamped to today.
5. Assignments tab — capped at end-of-today IST; progress sub-tabs filter correctly.
6. Pagination — 25 items/page; an out-of-range `page` returns the last page.
7. Category/type/module/instructor/priority filters narrow results; facet lists stay
   complete regardless of active filters.
