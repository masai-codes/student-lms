# My Calendar (`/my-calendar`)

Last updated: 2026-08-14

## Scope

Rebuild of the old LMS's `/my-calendar` (react-big-calendar month/week/day view
of the student's lectures + assignments + quizzes), REST-only per the project
guidelines, plus the "Subscribe to calendar" ICS flow. See
`docs/my-calendar-old-vs-new.md` for the full old-vs-new comparison and the
list of old-LMS dead code deliberately not rebuilt.

- `GET /api/calendar/events?start&end&batchId?` — merged, typed events for the
  visible range. Sections are ALWAYS derived server-side from the session user
  (`getSectionIdsForUser`); `batchId` can only narrow to one of the user's own
  enrolled batches (unknown batch → empty result, never a leak — the old
  GraphQL API trusted client-sent `section_ids`). True-overlap window
  semantics (`calendarOverlapClause`) with a ±1-day IST pad and an exact
  instant-level trim; enrolment-cancelled/paused batches filtered via
  `makePausedScheduleFilter`. `effectiveEnd` = `concludes` or schedule +
  1h/24h/2h (lecture/assignment/quiz). Lecture DTOs carry `joinLive` built by
  the shared `buildLearnListingCardCtas`.
- `GET /api/calendar/batches` — `{ id, name }` options for the batch filter.
- `GET /api/calendar/subscription-link` — mints/persists a personal feed token
  at `users.meta.calendar_token` (same key as the old LMS, so existing
  subscriptions keep working) and returns the feed URL.
- `GET /api/calendar/feed/$token(.ics)` — public tokened ICS feed (30 days
  back / 90 ahead), RFC 5545 with true-UTC DTSTART/DTEND, escaping + 75-octet
  line folding. Unknown/malformed token → 404.
- Page: `src/routes/(protected)/_layout/my-calendar/index.tsx` →
  `MyCalendarPage`. URL state `?view=&date=&batchId=` (full `YYYY-MM-DD` date,
  so weeks/days deep-link; defaults omitted). Month/Week/Day on desktop,
  Week/Day on mobile; Today button; stable per-type token colors + legend;
  event modal (local time + IST tooltip, host, join-live CTA, View details —
  none for quizzes: no quiz route exists yet); react-big-calendar skinned via
  `calendar-rbc.css` semantic-token overrides; skeleton/empty/error+retry
  states; GTM events (`l_calendar_*`).

## Test files

- `src/server/api/calendar/__tests__/calendarWindow.test.ts` — range
  validation (malformed/rollover/inverted/over-cap), TZ padding.
- `src/server/api/calendar/__tests__/buildCalendarEvent.test.ts` — IST
  stamping, per-type end fallbacks, detailPath rules, joinLive gating.
- `src/server/api/calendar/__tests__/getCalendarEvents.service.test.ts` —
  scoping, batch narrowing + leak prevention, restriction filtering,
  merge/sort, overlap trim.
- `src/server/api/calendar/__tests__/buildIcsFeed.test.ts` — UTC conversion,
  escaping, folding, UID/URL rules.
- `src/server/api/calendar/__tests__/getCalendarSubscription.service.test.ts`
  — token mint/reuse, meta preservation, token lookup hygiene.
- `src/server/api/calendar/handlers/__tests__/getCalendarEvents.handler.test.ts`
  — 200/400/401/500 mapping.
- `src/lib/calendar/calendarSearch.test.ts`, `calendarRange.test.ts`,
  `calendarColors.test.ts` — URL-state parsing, view ranges/titles/shifts,
  type styles.
- `src/lib/calendar/calendarEventMapping.test.ts` — **TZ-mutating**
  (registered in `TZ_MUTATING_TESTS`, runs in the forks pool): IST events land
  on the correct local day for a `America/New_York` viewer.
- `src/components/features/calendar/CalendarToolbar.test.tsx`,
  `EventDetailsModal.test.tsx`, `MyCalendarPage.test.tsx` — toolbar
  navigation/view/batch-filter wiring + GTM, modal contents per event type,
  page loading/empty/error+retry states and URL patching (react-big-calendar
  stubbed; jsdom has no layout).

## Commands

- `npx vitest run src/server/api/calendar src/lib/calendar src/components/features/calendar`
- `npm run test` (full suite, includes the TZ-mutating project)

## Not covered / notes

- The react-big-calendar grid itself (drag/scroll/layout) is not exercised in
  jsdom; verify visually via `/my-calendar` (browser-verify skill) in Default
  and a dark theme.
- The public ICS feed's portal resolution defaults to `masai` for calendar-app
  requests (they send no `X-App-Origin`).
- Batch-level quizzes with a null `section_id` are not surfaced (parity with
  the old LMS, which was also section-scoped).
