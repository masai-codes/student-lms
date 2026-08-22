# My Calendar — old LMS vs new LMS

Last updated: 2026-08-14. Companion to `docs/testing/features/my-calendar.md`.

## Why this page exists

The calendar answers one question for a student: **"what is scheduled for me,
and when?"** It merges everything time-bound from their enrolled sections —
live/scrum lectures, assignment windows, quizzes — into one month/week/day
view, and lets them subscribe from their own calendar app (Google/Outlook/
Apple) so the schedule follows them outside the LMS.

## What the old page was (audited, live code only)

- `experience-ui/.../SprintPlan/newCalendar.tsx` — one 971-line file, routed at
  `/my-calendar`, built on `react-big-calendar` + `momentLocalizer`.
- Data: GraphQL `BlockPlanEvents` with three roots (`lectures`, `assignments`,
  `quizzes`) filtered by `start_date_after` / `end_date_before` /
  `section_ids`, plus `GetCurrentUserSections` for the batch dropdown, plus
  REST `GET /calendar/link` for the ICS subscribe modal.
- Features: Month/Week/Day (Week/Day on mobile, default Week); batch filter
  ("All" + batches derived from the user's sections); `?view=&batch=&month=`
  URL params; "+N more" collapse at 3 events/day in month view; event modal
  (title, time via `TimeDisplay` with IST tooltip for non-IST users,
  instructor, "View Details" → `/lectures/:id` | `/assignments/:id` |
  `/quizzes/:id`); "Today is <date>" header from server time; Subscribe modal
  with Google/Outlook/Apple/copy.
- End-time fallbacks when `concludes` was null: lecture +1h, assignment +24h,
  quiz +2h.

## Old-LMS problems → what the rebuild does

| #   | Old LMS                                                                                                                                                                                                                                                        | New LMS                                                                                                                                                                                                                                                                             |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Security**: GraphQL resolvers applied whatever `section_ids` the client sent; omitting them made the query global.                                                                                                                                           | Sections always derived server-side from the session user; `batchId` can only narrow within the user's own enrolments (unknown batch → empty, 0 information leak).                                                                                                                  |
| 2   | **Timezone**: grid rendered timezone-naively by moment (IST wall-clock parsed as local), while the modal was IST-aware — grid and modal disagreed for non-IST users; date params were built with UTC getters off local boundaries (off-by-one at range edges). | Server stamps every datetime as explicit `+05:30` ISO; the grid places absolute instants in the viewer's local timezone; the fetch window carries a ±1-day IST pad with an exact trim. TZ-mutating test proves a late-IST event lands on the right local day in `America/New_York`. |
| 3   | **Window semantics**: `start_date OR end_date within window` missed events spanning the whole visible range.                                                                                                                                                   | True overlap (`span ∩ window ≠ ∅`), with a `schedule`-based fallback when `start_date` is null.                                                                                                                                                                                     |
| 4   | **Colors were meaningless**: two pastels alternated by array index, so the same type changed color row to row; no legend.                                                                                                                                      | One semantic-token family per type (lecture=brand, assignment=warning, quiz=success), identical in chips/modal/legend, correct in every theme incl. dark.                                                                                                                           |
| 5   | **No join flow**: `zoom_link` was fetched and mapped but no Join button existed anywhere on the page.                                                                                                                                                          | Live lectures carry `joinLive` (same `buildLearnListingCardCtas` ladder as Learn/Dashboard); the event modal shows the real Join Live CTA with ZEF/web-view handling.                                                                                                               |
| 6   | Broken states: sections-loading spinner was white-on-white (invisible); error state had no retry; empty grid had no message; modal closed only via the X.                                                                                                      | `dash-skeleton` loading, friendly empty state, error state with Retry, Radix modal (Esc/backdrop close), reduced-motion safe.                                                                                                                                                       |
| 7   | URL kept only the month name — a specific week/day could not be deep-linked; no Today button.                                                                                                                                                                  | `?view=&date=YYYY-MM-DD&batchId=` — any week/day deep-links; Today button; defaults omitted from the URL.                                                                                                                                                                           |
| 8   | Today-circle used client time while the header used server time.                                                                                                                                                                                               | One source: the anchor date and grid highlight derive from the same local "today".                                                                                                                                                                                                  |
| 9   | Tech debt: 971-line file, hardcoded `min/max` Dates from 2023, CSS classes referenced but defined nowhere, `console.log` left in.                                                                                                                              | ~20 focused files, all under the 200-line limit; typed REST DTOs shared client/server; `calendar-rbc.css` skins RBC with theme tokens.                                                                                                                                              |
| 10  | No analytics, almost no test coverage, no stable selectors.                                                                                                                                                                                                    | `l_calendar_*` GTM events on every interactive element, `data-testid` on everything, 67 focused tests (all layers) + full-suite green.                                                                                                                                              |

## Feature parity map

| Old feature                                      | New LMS                                                                                                                                                                                                                                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Month/Week/Day (Week/Day mobile, default Week)   | Same (`react-big-calendar` + `dayjsLocalizer` — moment dropped)                                                                                                                                                                                                                       |
| Lectures + assignments + quizzes, section-scoped | Same three sources — `GET /api/calendar/events` (one call instead of one GraphQL doc + sections query)                                                                                                                                                                                |
| Batch filter                                     | Same, `GET /api/calendar/batches`; hidden for single-batch students                                                                                                                                                                                                                   |
| End-time fallbacks 1h/24h/2h                     | Same, computed server-side as `effectiveEnd`                                                                                                                                                                                                                                          |
| "+N more" (custom, max 3/day)                    | RBC's built-in `popup` overlay, token-themed                                                                                                                                                                                                                                          |
| Event modal: title/time/instructor/details link  | Same + type badge, batch/section line, Join Live CTA; time uses `LocalTimeWithIstTooltip`                                                                                                                                                                                             |
| "View Details" → quizzes page                    | Lectures/assignments link; **quizzes have no detail route in the new LMS yet**, so quiz modals show info without a link                                                                                                                                                               |
| Subscribe to calendar (ICS)                      | Full rebuild: `GET /api/calendar/subscription-link` + public `GET /api/calendar/feed/$token.ics`. Token stored at the old key `users.meta.calendar_token`, so **existing student subscriptions keep working**. Feed now mirrors the page exactly (incl. quizzes) with true-UTC times. |
| Ban/paused enrolment rules                       | Old `status_time` cutoff logic superseded by the new LMS restriction model (`makePausedScheduleFilter`), same as the dashboard feed                                                                                                                                                   |

## Deliberately NOT rebuilt (dead/stale in the old LMS)

- `CalendarDataProvider.tsx` (609 lines), `CalendarComponents.tsx`,
  `CalendarUtils.tsx` — an unused parallel refactor; imported by nothing.
- The REST `/block-plan-events/*` surface and its `useCalendarEvents` hooks —
  built for this page but never wired to it (only the dashboard's
  sticky-banner/help-session endpoints were live).
- The `adhoc-sessions` event type — never requested by the page.
- `DayCellWrapper`, `isCalendarReady`, `formatTimeFromNumber`, the
  commented-out gradient header, unreachable color entries
  (`reading`/`practice`/`live`), deprecated Subscribe props, the referral
  fetch in `HeaderCard`, fields fetched but never rendered
  (`start_time`/`end_time`/`section_id`/`is_new_zoom_redirection`).
- The `country-finder.masaischool.com` lookup — already dead upstream
  (replaced by `Intl.DateTimeFormat().resolvedOptions().timeZone`).

## New-LMS file map

- Server: `src/server/api/calendar/` (`calendarTypes`, `calendarWindow`,
  `calendarOverlap`, `fetchCalendar{Lectures,Assignments,Quizzes}.service`,
  `buildCalendarEvent`, `getCalendarEvents.service`,
  `getCalendarBatches.service`, `getCalendarSubscription.service`,
  `buildIcsFeed`, `handlers/*`); routes `src/routes/api/calendar/*`.
- Client data: `src/lib/api/calendarPaths.ts`,
  `src/lib/api/calendar/calendarApi.ts`, `src/query/calendar/calendarQueries.ts`,
  `src/lib/calendar/{calendarSearch,calendarRange,calendarEventMapping,calendarColors}.ts`.
- UI: `src/components/features/calendar/*` + `calendar-rbc.css`; page route
  `src/routes/(protected)/_layout/my-calendar/index.tsx`.
- Wiring: nav item flipped to internal in `src/lib/navigation/useAppNavItems.tsx`;
  `/my-calendar` added to `src/utils/migratedRoutes.ts`.

## Open items / release notes

- **Cross-repo release step**: add `/my-calendar` to the old LMS's
  `isMigratedPath` (`experience-ui/.../newLmsPages.utils.ts`) so opted-in
  students land here instead of the old page.
- The public feed token has no revocation/rotation UX yet (the old LMS had
  none either).
- `findUserIdByCalendarToken` does a JSON-path scan over `users.meta`; if feed
  traffic grows, add a generated column + index migration.
- Batch-level quizzes (`section_id IS NULL`) are invisible (old-LMS parity) —
  product call needed if they should surface.
