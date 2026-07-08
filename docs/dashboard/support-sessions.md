# Support Sessions section

The sidebar "LMS Support" card — **one** featured help session. The backend
fetches the shared help-session lectures for the next ~8 days, then selects the
single session the card should show. Served via `GET /api/dashboard/overview` →
`supportSession` (the featured session, or `null`).

- **Fetch:** `src/server/api/dashboard/support/getSupportSessions.service.ts`
- **Status logic:** `src/server/api/dashboard/support/supportSessionStatus.ts`
- **Card selection:** `src/server/api/dashboard/support/featuredSupportSession.ts`
- **Source:** the `lectures` table (help-session section).

## Logic

Lectures from the `lectures` table where **all** hold:

1. **Help-session section** — `section_id = HELP_SESSION_SECTION_ID` (`7576`),
   the single hardcoded section that holds all support-session lectures.
2. **Scheduled today → ~a week out** — `schedule >= start of today` AND
   `schedule <= end of (today + 8 days)`, in **IST**
   (`getIstDayWindow(now, 8)`).
3. **Not deleted** — `deleted_at IS NULL`.
4. **Passes the banned cutoff** — for banned users, only sessions available
   on/before their ban time (`getBannedContentCutoffForUser` +
   `isContentWithinBannedCutoff`, keyed on `schedule`).

Ordered by `schedule` **ascending** (soonest first). Each session carries
`id`, `title`, `schedule`, `concludes`, `zoomLink`, plus the computed `status`.

## One card at a time

The dashboard shows a single card, chosen by `selectFeaturedSupportSession`:

- a **live** session (join-able now) always wins; otherwise
- the **soonest session that hasn't started yet** (today's if still valid, else
  the next day's).

Past/ended sessions are skipped. When nothing qualifies the selector returns
`null` and the card is **hidden entirely** (the frontend also hides it while the
overview query is loading — no mock fallback for this card).

The featured session's `status` drives the three render states of the card
(`LmsSupportPanel`). Always present: the `/lmssupportsession.svg` illustration
and the **"LMS Support Session"** heading. What changes:

- **`live`** — blue card (`bg #E1EFFE`, border `#C3DDFD`); subtext **"We're live
  now to help you"**; no time pill; the only clickable element is a **"Join
  Now"** button that opens `zoomLink` in a new tab.
- **`today`** — gray card (`bg #F9FAFB`, border `#E5E7EB`); subtext **"Join our
  daily session to get your questions answered"**; a yellow (`#FDF6B2`) time
  pill with today's start time (e.g. **"2 Jul, 6:30 PM (IST)"**); no button.
- **`upcoming`** — gray card; subtext **"No session today, the next session is
  scheduled for"**; the same yellow pill with the next session's date/time; no
  button.

The card body itself is never clickable — joining is possible only during the
live window. The time pill appears only in `today`/`upcoming`, never in `live`.

## Everything on the backend

The reference implementation in the old repo returned only the raw time-ordered
list and let the **UI** decide "is it live / is it today". Here that decision
lives on the backend so the frontend only renders:

- `schedule` / `concludes` are formatted as **IST ISO-8601** (`…+05:30`) —
  `formatIstWallClock` — because the DB stores IST wall-clock times.
- `status` is computed by `resolveSupportSessionStatus(schedule, concludes,
  istNow)`:
  - **`live`** — `schedule <= now` AND (`concludes` is null OR `now <=
    concludes`).
  - **`today`** — same IST calendar day as now (and not live).
  - **`upcoming`** — otherwise (future day, or no schedule).

  Comparisons use IST wall-clock strings (`getIstNowSqlDatetime`), which sort
  correctly with plain lexical `<=`.

The frontend `LmsSupportPanel` just maps `status` → a badge (Live / Today /
Upcoming), prints the IST time, and links `zoomLink`. When the list is empty it
shows a generic support CTA.

## Notes

- The window filter is on `schedule >= start of today`, so sessions earlier
  today (already concluded) are still returned and surface as `today`.
- `HELP_SESSION_SECTION_ID = 7576` is hardcoded (matches the source system); if
  it ever moves, change the one constant in the service.
