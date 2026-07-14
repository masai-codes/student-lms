# Schedule tab (My Schedule + Pending Tasks)

"Everything happening in my next 7 days" — the lectures + assignments in the
user's sections, merged into one feed. Served via `GET /api/dashboard/overview`
→ `schedule`.

- **Orchestrator:** `src/server/api/dashboard/schedule/getDashboardSchedule.service.ts`
- **Queries:** `fetchScheduleLectures.service.ts`, `fetchScheduleAssignments.service.ts`
- **Window:** `scheduleWindow.ts`
- **Types:** `scheduleTypes.ts`

## Logic

Two tables, **same filter**, merged output:

1. **Scope to the user's sections** — `section_id IN (getSectionIdsForUser)`.
   No sections → empty list.
2. **`start_date` OR `end_date` within the 7-day window** — the window is
   `[today, today + 7]` in **IST** (`getScheduleDateWindow`). These are `date`
   columns, so we filter on them — but return **`schedule`/`concludes`** for the
   UI (different column pairs).
3. **`deleted_at IS NULL`**.
4. **Banned cutoff** — banned users only see rows whose `schedule` is on/before
   `users.status_time`.

Each table is queried separately with the identical filter, tagged with its
`learningType` (`lecture` / `assignment`), and concatenated; the merged list is
sorted **soonest-schedule first**.

## Pending Tasks (second tab)

Served via `GET /api/dashboard/overview` → `pendingTasks` (`getDashboardPendingTasks`).
The tab badge counts these items. Two sources, merged (assignments first, then
catch-up lectures), rendered by the **same** reused card:

**Pending assignments** (`fetchPendingAssignments` + `fetchAssignmentStartState`):

- in the user's sections, `deleted_at IS NULL`;
- **deadline not passed** — `concludes > now` (IST); overdue ones drop off;
- **not begun** — the user has no submission that is `started = true` OR has
  `data.assess_platform_link_clicked` set. A draft/untouched row (started false,
  no link click) counts the same as **no row** → still pending;
- passes the banned cutoff; ordered `concludes ASC`.

Both are sorted together by **urgency — least time remaining first** (not by
type): assignments by their deadline countdown (`computeDeadlineCountdown`,
`concludes − now`), catch-up lectures by their remaining catch-up days
(`attendance.daysRemaining`). Assignments show a **"N days remaining"** label
(or **"N hours remaining"** under a day) on the card — the same
`assignmentDeadlineLabel` is produced by `buildLearnListingCardCtas`, so `/learn`
assignment cards show it too (reused). Lectures already show their catch-up
"N days remaining".

**Catch-up lectures** (`fetchPendingLectures`):

- mandatory (`optional != 1`), **not** `resource`/`scrum` type, in the user's
  sections, `deleted_at IS NULL`;
- already concluded (`concludes < now`, IST) **but the catch-up window is still
  open** — decided by the reused attendance summary
  (`fetchLectureAttendanceSummaries` → `isCatchupWindowOver === false`, i.e. the
  `computeCatchUpWindow` "days remaining" logic from `/learn`). The student can
  still watch the recording to earn attendance.

## Reuse (the important part)

The rows are shaped as the learn listing's `LearningEntityRow` and mapped with
the **same** learn utilities, so the **same card** renders them:

- `buildLearnListingCardCtas` — Join Live state, attendance/assignment chips.
  (On the listing the "Join Live" CTA is a _state_; the card links to the
  lecture/assignment detail page, where the actual zoom join + adaptive-link
  transform happens — so no zoom transform is needed here.)
- `mapLearningEntityRow` — row → `LearningItem`.
- `fetchLectureAttendanceSummaries` — mandatory-lecture attendance.

`DashboardScheduleItem` = `LearningItem` + two dashboard-only fields:

- **`courseName`** — the "which course" label, only when the user is in **more
  than one batch**. Fallback chain `sections.name → batches.name → null` (hence
  the `sections → batches` join). Truncated in the UI.
- **`enableZoomWebView`** — from `sections.settings` (lectures), reused by the
  join flow.

## Frontend

The schedule tab reuses the `/learn` `LearnContentCard`:

- `scheduleItemToLearnContent` maps a `DashboardScheduleItem` to the client
  `LearnContentItem` (the same mapping the learn page uses) plus `courseName`.
- `LearnContentCard` gained an optional `courseName` and a `fromDashboard` flag.
  `fromDashboard` renders a **compact 2-row card** (title on row 1; date-range +
  course + tags combined on row 2 — no host/priority), so rows stay short.
- **Date display** reuses `timeZoneHandler`: `scheduleItemToLearnContent` sets
  `date = formatScheduleRangeLocal(schedule, concludes)` (viewer-local, leading
  date, e.g. "2 Jul, 6:30 PM - 7:30 PM (IST)" — an IST device shows "(IST)";
  others show their tz) and `dateTooltip = formatScheduleRangeIST(...)` (always
  IST) shown on hover. DB datetimes are IST wall-clock, parsed via
  `parseMysqlDatetimeIST`. Cross-day ranges include both dates.
- `buildScheduleWeek(items, now)` builds the fixed **7-day window** (today …
  today + 6, IST) — **every day appears**, empty ones included — plus a range
  label ("Jul 02 - 08"). `ScheduleSection` renders a week header + one row per
  day: a left **date badge** (weekday + day; today highlighted blue) and the
  reused card(s) on the right, or a "No sessions scheduled for the day"
  placeholder. Loading / error come from the shared overview query.
- The **Pending Tasks** tab renders `pendingTasks` as a flat list of the same
  reused cards (loading / error / empty), and the tab badge shows
  `pendingTasks.length` (hidden when zero).

## Notes

- `assignmentProgressStatus` is wired: `fetchLatestSubmissionByAssignment`
  (extracted from the learn listing for reuse) + `calculateAssignmentProgressStatus`
  drive the assignment status chip.
- Assignments have no `module`/`zoom_link` columns — normalised to `null`.
- Clicking a card routes to the lecture/assignment **detail** page (where the
  real zoom join + adaptive-link transform lives); the listing "Join Live" is a
  CTA state.
