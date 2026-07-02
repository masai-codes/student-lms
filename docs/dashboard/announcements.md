# Announcements section

The sidebar "Announcements" panel. It combines two feeds into a single list of
at most **5** cards, served via `GET /api/dashboard/overview` → `announcements`.

- **Orchestrator:** `src/server/api/dashboard/announcements/getAnnouncementsFeed.service.ts`
- **Feed A:** `getSectionAnnouncements.service.ts`
- **Feed B:** `getForYouMessages.service.ts`
- **Pure combine/sort/cap + types:** `announcementFeed.ts`

## Feed A — section announcements (`announcements` table)

A row is included when **all** hold:

1. **In one of my sections** — `section_id IN (my section IDs)`, where my
   sections come from the reusable `getSectionIdsForUser(userId)`
   (`section_user → sections`, non-deleted).
2. **Not deleted** — `deleted_at IS NULL`.
3. **In its release window** (IST) — `schedule <= now` AND
   (`concludes IS NULL OR concludes >= now`).
4. **Tracked + unread** — `track_read = true` AND one of:
   - no `announcement_reads` row for me, OR
   - my read record is flagged `is_unread = true`, OR
   - it's a popup (`show_as_popup = true`) I haven't displayed yet
     (`popup_display` null/false).
5. **Passes the banned cutoff** — see below.

Rendered without a "For You" tag (`isForYou = false`, `source = 'a'`).

## Feed B — "For You" messages (`messages` table)

A row is included when **all** hold:

1. **Top-level bulk message for me** — `message_id IS NULL`, `user_id = me`,
   `deleted_at IS NULL`.
2. **Unread** — `read_at IS NULL`.
3. **Active window** (IST) — `schedule IS NULL` OR (`schedule <= now` AND
   (`concludes IS NULL OR concludes >= now`)).
4. **Passes the banned cutoff**.

Title prefers `meta.title`, falling back to `subject`. Rendered **with** a
"For You" tag (`isForYou = true`, `source = 'm'`).

## Combine + sort + cap

Both feeds are merged, sorted **newest-first** by `schedule` (falling back to
`created_at`), and the top **5** are returned (`combineAnnouncementFeeds`,
`DASHBOARD_ANNOUNCEMENTS_LIMIT`). Items with no timestamp sort last. Each feed
is individually pre-limited to 5 in the DB (ordered by the same
`COALESCE(schedule, created_at)`), so the merge only ever considers real
candidates.

## Banned cutoff

Reused from the banner work: `getBannedContentCutoffForUser(userId)` loads the
user's status once and returns a cutoff `Date` (or `null` when not banned).
`isContentWithinBannedCutoff({ createdAt, startDate: schedule }, cutoff)` then
hides any item **created or scheduled after** the ban time — "only items
available on/before my ban time".

## IST clock

Window comparisons use `getIstNowSqlDatetime(now)` (`src/server/time/istClock.ts`)
which renders "now" as an IST wall-clock `YYYY-MM-DD HH:MM:SS` string. The
`schedule`/`concludes` columns are IST wall-clock, so the string binds directly
into `<=` / `>=` comparisons in the query builder — no raw `CONVERT_TZ`.

## Notes

- The older `src/server/api/dashboard/getDashboardAnnouncements.service.ts`
  (raw-SQL, used by the legacy `right-section` endpoint, no banned cutoff) is
  superseded by this modular feed and can be retired once the right-section
  route is migrated.
- Schema additions for this feature: `announcement_reads` table; `track_read`,
  `show_as_popup`, `cta_name`, `cta_link`, `meta` on `announcements`;
  `show_as_popup`, `cta_name`, `cta_link`, `schedule`, `concludes` on `messages`.
