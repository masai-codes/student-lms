# Dashboard Test Cases

## Scope

Dashboard at the protected home route (`/(protected)/_layout/`), being migrated
section by section from static mock UI to live API data (see
`docs/dashboard/`). Covers:

- **Frontend** components under `src/components/features/dashboard/**`: profile
  action banner, welcome greeting + promotional banner carousel (with per-load
  rotation), schedule / pending-tasks card, sidebar panels.
- **Backend** for the consolidated `GET /api/dashboard/overview` endpoint and
  the reusable modules it composes: welcome-banner visibility/window rules, the
  announcements feed (Feed A section announcements + Feed B "For You" messages),
  the product-updates feed (newest global `whatsnew`, 25/page → top 5), the
  support-sessions feed (help sessions for the next ~8 days with backend-decided
  live/today/upcoming status), the banned-user content util, the section/batch
  membership helpers, and the IST clock.

Welcome banners, announcements, product updates and support sessions are
API-driven; the remaining sections still render from `MOCK_DASHBOARD_DATA` until
migrated.

## Test Files

- `src/components/features/dashboard/shared/scheduleUtils.test.tsx`
- `src/components/features/dashboard/shared/bannerRotation.test.ts`
- `src/components/features/dashboard/section-banner/ProfileActionBanner.test.tsx`
- `src/components/features/dashboard/section-welcome/WelcomeBannerCarousel.test.tsx`
- `src/components/features/dashboard/section-welcome/WelcomeSection.test.tsx`
- `src/components/features/dashboard/section-schedule/ScheduleCard.test.tsx`
- `src/components/features/dashboard/section-schedule/ScheduleWeekGroup.test.tsx`
- `src/components/features/dashboard/section-schedule/ScheduleSection.test.tsx`
- `src/components/features/dashboard/section-sidebar/AnnouncementsPanel.test.tsx`
- `src/components/features/dashboard/section-sidebar/ProductUpdatesPanel.test.tsx`
- `src/components/features/dashboard/section-sidebar/LmsSupportPanel.test.tsx`
- `src/components/features/dashboard/section-sidebar/DashboardSidebar.test.tsx`
- `src/components/features/dashboard/DashboardPage.test.tsx`
- `src/server/users/__tests__/bannedContent.test.ts`
- `src/server/users/__tests__/getBannedContentCutoffForUser.test.ts`
- `src/server/time/__tests__/istClock.test.ts`
- `src/server/batches/__tests__/getSectionIdsForUser.test.ts`
- `src/server/api/dashboard/banners/__tests__/welcomeBannerVisibility.test.ts`
- `src/server/api/dashboard/banners/__tests__/getWelcomeBanners.service.test.ts`
- `src/server/api/dashboard/announcements/__tests__/announcementFeed.test.ts`
- `src/server/api/dashboard/announcements/__tests__/getSectionAnnouncements.service.test.ts`
- `src/server/api/dashboard/announcements/__tests__/getForYouMessages.service.test.ts`
- `src/server/api/dashboard/announcements/__tests__/getAnnouncementsFeed.service.test.ts`
- `src/server/api/dashboard/product-updates/__tests__/getProductUpdates.service.test.ts`
- `src/server/api/dashboard/support/__tests__/supportSessionStatus.test.ts`
- `src/server/api/dashboard/support/__tests__/getSupportSessions.service.test.ts`
- `src/server/api/dashboard/support/__tests__/featuredSupportSession.test.ts`
- `src/server/api/dashboard/__tests__/getDashboardOverview.service.test.ts`
- `src/server/api/dashboard/handlers/__tests__/getDashboardOverview.handler.test.ts`

## How To Run

- Frontend: `npm run test -- src/components/features/dashboard`
- Backend: `npm run test -- src/server/api/dashboard src/server/users`
- Run all tests: `npm run test`

## Covered Test Cases

- `DASH-001` - Module: `getScheduleTypeVisual` - Case: every schedule item type maps to an icon + a distinct `text-*` colour class - Status: Covered
- `DASH-002` - Module: `ProfileActionBanner` - Case: renders the label + default "Take Photo" action, supports a custom action label and fires `onAction`, and exposes accessible prev/next controls - Status: Covered
- `DASH-003` - Module: `WelcomeBannerCarousel` - Case: embla drag-swipe carousel; renders nothing when empty; single banner shows title/description with no arrows/dots; >1 shows bounded arrows + one dot per banner; `cta_url` routing (`/` internal same-tab, full URL new tab, none → `/changemakers-circle`); pushes the `l_dashboard_banner_carousel_<key>_id_<id>` GTM event on a non-drag click (a drag swallows the click). (Arrow/dot navigation + drag physics are embla-native, exercised in-browser; jsdom asserts render/link/GTM only.) - Status: Covered
- `DASH-004` - Module: `WelcomeSection` - Case: renders the "Welcome" greeting and the student name - Status: Covered
- `DASH-005` - Module: `ScheduleCard` - Case: renders the title, time, course code, category and module chips - Status: Covered
- `DASH-006` - Module: `ScheduleWeekGroup` - Case: renders the week label and both active + inactive day badges with their items - Status: Covered
- `DASH-007` - Module: `ScheduleSection` - Case: shows the schedule feed + pending-task count by default, switches to the pending-tasks empty state on tab click, and shows the empty schedule message when there are no weeks - Status: Covered
- `DASH-008` - Module: `AnnouncementsPanel` - Case: loading spinner + error message from query state; the whole section is hidden (returns null) when the fetch succeeded with 0 announcements; rows with the "For you" badge only on messages; message → `/messages/$id`, announcement → `/announcements/$id` - Status: Covered
- `DASH-009` - Module: `ProductUpdatesPanel` - Case: loading + error states; empty state (header + View All + "No content available"); rows linking to `/whats-new/$id` - Status: Covered
- `DASH-010` - Module: `LmsSupportPanel` - Case: renders the support-session call-to-action - Status: Covered
- `DASH-011` - Module: `DashboardSidebar` - Case: composes the announcements, product-updates and support panels - Status: Covered
- `DASH-012` - Module: `DashboardPage` / `DashboardLayout` - Case: renders the static sections plus the API-driven welcome banner (from the overview query), and falls back to mock banners before the query resolves - Status: Covered
- `DASH-013` - Module: `bannerRotation` - Case: superseded by `DASH-038` (rotation is now banner-id based) - Status: N/A
- `DASH-014` - Module: `bannedContent` - Case: `isBannedUser` true only for exact `banned` status; `getBannedContentCutoff` null unless banned with a valid `status_time`; `isContentWithinBannedCutoff` hides content created/started after the cutoff, allows everything with no cutoff, ignores invalid dates - Status: Covered
- `DASH-015` - Module: `welcomeBannerVisibility` - Case: A/B/C/D group bucket by `userId % 4`; `visible_to` parsing (string/object/malformed → empty targeting); batch + group matching (empty = everyone); IST `now` shift and wall-clock parse; window inclusion with open-ended bounds - Status: Covered
- `DASH-016` - Module: `getWelcomeBanners` (service) - Case: composes batch ids + banned cutoff + DB rows to return in-window banners mapped to the DTO; drops out-of-window banners; keeps only batch-targeted banners the user belongs to; hides banners created after a banned user's cutoff - Status: Covered
- `DASH-017` - Module: `getDashboardOverview` (service) - Case: composes `getWelcomeBanners(userId, now)` into the single `{ banners }` payload - Status: Covered
- `DASH-018` - Module: `handleGetDashboardOverview` (handler) - Case: returns the overview payload for an authenticated user (200), 401 when unauthenticated, and maps an unexpected service failure to 500 - Status: Covered
- `DASH-019` - Module: `DashboardPage` (automation hooks) - Case: the page exposes the stable `data-testid` catalog (root, profile banner, welcome, schedule, sidebar, announcements + product-updates panels) documented in `docs/dashboard/README.md`; the support card hook is conditional (hidden while loading / when none) - Status: Covered
- `DASH-020` - Module: `getIstNowSqlDatetime` - Case: shifts UTC by +5:30 into a MySQL `YYYY-MM-DD HH:MM:SS` string and rolls the date across the IST midnight boundary - Status: Covered
- `DASH-021` - Module: `getSectionIdsForUser` - Case: returns the distinct non-deleted section ids for the user; empty when none - Status: Covered
- `DASH-022` - Module: `getBannedContentCutoffForUser` - Case: null for a non-banned/missing user, the cutoff date for a banned user - Status: Covered
- `DASH-023` - Module: `combineAnnouncementFeeds` - Case: merges feeds, sorts newest-first by `sortedAt`, caps at the limit, sinks missing timestamps last - Status: Covered
- `DASH-024` - Module: `getSectionAnnouncements` (Feed A) - Case: early-returns without querying when the user has no sections; maps rows to ranked `source:'a'` items; falls back to `createdAt` for `sortedAt`; drops rows created/scheduled after a banned cutoff - Status: Covered
- `DASH-025` - Module: `getForYouMessages` (Feed B) - Case: maps rows to ranked `source:'m'`/`isForYou` items; prefers `meta.title` over `subject` (falls back for blank/non-string); drops rows created/scheduled after a banned cutoff - Status: Covered
- `DASH-026` - Module: `getAnnouncementsFeed` (orchestrator) - Case: composes section ids + banned cutoff + IST now into both feeds and returns the combined, newest-first, capped list - Status: Covered
- `DASH-027` - Module: `getDashboardOverview` (service) - Case: composes `getWelcomeBanners`, `getAnnouncementsFeed` and `getProductUpdates` into `{ banners, announcements, productUpdates }` (forwarding `(userId, now)`), and caps product updates at the dashboard limit of 5 - Status: Covered
- `DASH-028` - Module: `DashboardPage` (announcements + product-updates wiring) - Case: renders API-driven announcements (with the "For You" badge) and product updates once the overview query resolves - Status: Covered
- `DASH-029` - Module: `getProductUpdates` (service) - Case: maps newest `whatsnew` rows to the DTO for everyone (no targeting); defaults to a 25-row page at offset 0 and forwards explicit limit/offset; hides updates created after a banned user's cutoff - Status: Covered
- `DASH-030` - Module: `getIstDayWindow` / `formatIstWallClock` - Case: window spans start-of-today → end-of-day-N in IST (rolling months/day boundary); wall-clock → `…+05:30` ISO, null passthrough - Status: Covered
- `DASH-031` - Module: `resolveSupportSessionStatus` - Case: live (between schedule/concludes, incl. open-ended), today (later-today not-started + earlier-today ended), upcoming (future day / missing schedule) - Status: Covered
- `DASH-032` - Module: `getSupportSessions` (service) - Case: formats schedule/concludes as IST ISO and computes status; marks future-day as upcoming with null concludes preserved; hides sessions scheduled after a banned user's cutoff - Status: Covered
- `DASH-033` - Module: `getDashboardOverview` (service) - Case: also composes `getSupportSessions(userId, now)` and features the selected session under `supportSession` - Status: Covered
- `DASH-034` - Module: `selectFeaturedSupportSession` - Case: null for empty; prefers a live session; else the soonest not-yet-started session; null when all sessions are already past - Status: Covered
- `DASH-035` - Module: `LmsSupportPanel` (UI) - Case: renders nothing with no session; live → blue card + "We're live now to help you" + Join Now (new tab), no time pill; today → gray + "Join our daily session…" + IST time pill "2 Jul, 6:30 PM (IST)", no button; upcoming → gray + "No session today…" + pill - Status: Covered
- `DASH-036` - Module: `DashboardPage` (live-section wiring) - Case: renders API-driven banner + announcements + product updates + support once the query resolves; while loading shows the announcements/product-updates loading state and hides the banner + support cards - Status: Covered
- `DASH-037` - Module: `buildBannerAnalyticsKey` - Case: prefers the group name; falls back to `type_variant` (trimming/ignoring blanks; empty when all absent) - Status: Covered
- `DASH-038` - Module: `bannerRotation` (id-based) - Case: `computeNextBannerIndex` advances one past the last id and wraps (0 for null/unknown/empty); `nextRotatedBannerIndex`/`rememberBannerId` round-trip via localStorage and fall back to 0 on storage errors - Status: Covered

## Maintenance Rules

- Add new IDs sequentially; do not reuse old IDs.
- Keep this file and the feature matrix updated in the same PR when dashboard
  behavior or tests change.
- As each section migrates from `MOCK_DASHBOARD_DATA` to the overview API, add
  its cases here and update the migration table in `docs/dashboard/README.md`.
