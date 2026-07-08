# Next-action banner

Last updated: 2026-07-09

## Scope

- Compact pill surfacing the student's single most relevant next action —
  "Start" an evaluation or "View" for a live/scrum lecture. Shows only
  icon · status label · countdown/CTA; the event title is hidden by default and
  revealed in a hover tooltip (`next-action-banner-title`). Rendered top-right in
  the desktop navbar (`AppNavbar` `centerSlot`) and above the mobile tab bar
  (`AppMobileTabBar`).
- Replaces the old `UpcomingLecturePill` (deleted): same placements, but the
  view logic is now extracted into a pure, unit-tested module.
- Data source is unchanged: `GET /api/dashboard/navbar-pill` →
  `getNavbarPillEvent` (backend already ranks evaluation > live > scrum within
  the `schedule − 5min → concludes` window). The frontend only renders the
  chosen event and keeps its countdown live.

## Presentation logic — `src/lib/nextActionBanner.ts`

Pure, framework-free module driving the view:

- `resolveNextActionBannerView(event, nowMs)` → `NextActionBannerView | null`.
  Returns `null` for no event, a missing timestamp, or an already-concluded
  event. Otherwise derives `isStarted`, `label`
  (`Upcoming lecture` / `Lecture has started` / evaluation variants),
  `countdownMs` (`null` once started), `precise` (evaluations tick to the
  second), `ctaText` (`Start` for evaluations, `View` otherwise), and
  `tickMs`.
- `formatCountdown(ms, precise)` → `MM:SS` for evaluations, `N mins`
  (rounded up, min 1) for lectures; clamps negatives.

## Component — `src/components/features/layout/NextActionBanner.tsx`

- Fetches via `fetchNavbarPillEvent` (React Query, 5-min refresh).
- Uses `useServerTime()` for a server-adjusted `now` and a local interval
  (`useCountdownTick`) to keep the countdown live.
- Renders nothing when the resolved view is `null`.
- Fires `next_action_banner_cta_click_id_<id>` (via `pushGtmEvent`) on CTA click.

## Test files

- `src/lib/nextActionBanner.test.ts` — covers null/empty/concluded returns,
  lecture vs evaluation labelling + countdown, start-boundary clamping, and
  both `formatCountdown` modes.

## Notes

- Component wiring (`useServerTime` + interval + query) is left to
  automation/e2e via the `next-action-banner*` `data-testid`s; the branching
  logic is fully unit-covered in the pure module above.
