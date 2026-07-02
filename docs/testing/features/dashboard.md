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
  the banned-user content util, the section/batch membership helpers, and the
  IST clock.

Welcome banners and announcements are API-driven; the remaining sections still
render from `MOCK_DASHBOARD_DATA` until migrated.

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
- `src/server/api/dashboard/__tests__/getDashboardOverview.service.test.ts`
- `src/server/api/dashboard/handlers/__tests__/getDashboardOverview.handler.test.ts`

## How To Run

- Frontend: `npm run test -- src/components/features/dashboard`
- Backend: `npm run test -- src/server/api/dashboard src/server/users`
- Run all tests: `npm run test`

## Covered Test Cases

- `DASH-001` - Module: `getScheduleTypeVisual` - Case: every schedule item type maps to an icon + a distinct `text-*` colour class - Status: Covered
- `DASH-002` - Module: `ProfileActionBanner` - Case: renders the label + default "Take Photo" action, supports a custom action label and fires `onAction`, and exposes accessible prev/next controls - Status: Covered
- `DASH-003` - Module: `WelcomeBannerCarousel` - Case: renders nothing for an empty banner list; renders banner title + subtitle when banners are provided - Status: Covered
- `DASH-004` - Module: `WelcomeSection` - Case: renders the "Welcome" greeting and the student name - Status: Covered
- `DASH-005` - Module: `ScheduleCard` - Case: renders the title, time, course code, category and module chips - Status: Covered
- `DASH-006` - Module: `ScheduleWeekGroup` - Case: renders the week label and both active + inactive day badges with their items - Status: Covered
- `DASH-007` - Module: `ScheduleSection` - Case: shows the schedule feed + pending-task count by default, switches to the pending-tasks empty state on tab click, and shows the empty schedule message when there are no weeks - Status: Covered
- `DASH-008` - Module: `AnnouncementsPanel` - Case: renders each announcement with the "For You" tag only when flagged; shows the empty state when there are none - Status: Covered
- `DASH-009` - Module: `ProductUpdatesPanel` - Case: renders each update as an actionable row; shows the empty state when there are none - Status: Covered
- `DASH-010` - Module: `LmsSupportPanel` - Case: renders the support-session call-to-action - Status: Covered
- `DASH-011` - Module: `DashboardSidebar` - Case: composes the announcements, product-updates and support panels - Status: Covered
- `DASH-012` - Module: `DashboardPage` / `DashboardLayout` - Case: renders the static sections plus the API-driven welcome banner (from the overview query), and falls back to mock banners before the query resolves - Status: Covered
- `DASH-013` - Module: `bannerRotation` (`computeNextBannerIndex` / `nextRotatedBannerIndex`) - Case: index starts at 0 for null/invalid/empty, advances one step and wraps; persists across page loads via localStorage; falls back to 0 when storage throws - Status: Covered
- `DASH-014` - Module: `bannedContent` - Case: `isBannedUser` true only for exact `banned` status; `getBannedContentCutoff` null unless banned with a valid `status_time`; `isContentWithinBannedCutoff` hides content created/started after the cutoff, allows everything with no cutoff, ignores invalid dates - Status: Covered
- `DASH-015` - Module: `welcomeBannerVisibility` - Case: A/B/C/D group bucket by `userId % 4`; `visible_to` parsing (string/object/malformed → empty targeting); batch + group matching (empty = everyone); IST `now` shift and wall-clock parse; window inclusion with open-ended bounds - Status: Covered
- `DASH-016` - Module: `getWelcomeBanners` (service) - Case: composes batch ids + banned cutoff + DB rows to return in-window banners mapped to the DTO; drops out-of-window banners; keeps only batch-targeted banners the user belongs to; hides banners created after a banned user's cutoff - Status: Covered
- `DASH-017` - Module: `getDashboardOverview` (service) - Case: composes `getWelcomeBanners(userId, now)` into the single `{ banners }` payload - Status: Covered
- `DASH-018` - Module: `handleGetDashboardOverview` (handler) - Case: returns the overview payload for an authenticated user (200), 401 when unauthenticated, and maps an unexpected service failure to 500 - Status: Covered
- `DASH-019` - Module: `DashboardPage` (automation hooks) - Case: the page exposes the stable `data-testid` catalog (root, profile banner, welcome, schedule, sidebar, and each sidebar panel) documented in `docs/dashboard/README.md` - Status: Covered
- `DASH-020` - Module: `getIstNowSqlDatetime` - Case: shifts UTC by +5:30 into a MySQL `YYYY-MM-DD HH:MM:SS` string and rolls the date across the IST midnight boundary - Status: Covered
- `DASH-021` - Module: `getSectionIdsForUser` - Case: returns the distinct non-deleted section ids for the user; empty when none - Status: Covered
- `DASH-022` - Module: `getBannedContentCutoffForUser` - Case: null for a non-banned/missing user, the cutoff date for a banned user - Status: Covered
- `DASH-023` - Module: `combineAnnouncementFeeds` - Case: merges feeds, sorts newest-first by `sortedAt`, caps at the limit, sinks missing timestamps last - Status: Covered
- `DASH-024` - Module: `getSectionAnnouncements` (Feed A) - Case: early-returns without querying when the user has no sections; maps rows to ranked `source:'a'` items; falls back to `createdAt` for `sortedAt`; drops rows created/scheduled after a banned cutoff - Status: Covered
- `DASH-025` - Module: `getForYouMessages` (Feed B) - Case: maps rows to ranked `source:'m'`/`isForYou` items; prefers `meta.title` over `subject` (falls back for blank/non-string); drops rows created/scheduled after a banned cutoff - Status: Covered
- `DASH-026` - Module: `getAnnouncementsFeed` (orchestrator) - Case: composes section ids + banned cutoff + IST now into both feeds and returns the combined, newest-first, capped list - Status: Covered
- `DASH-027` - Module: `getDashboardOverview` (service) - Case: composes both `getWelcomeBanners` and `getAnnouncementsFeed` into `{ banners, announcements }`, forwarding `(userId, now)` - Status: Covered
- `DASH-028` - Module: `DashboardPage` (announcements wiring) - Case: renders API-driven announcements (with the "For You" badge) once the overview query resolves - Status: Covered

## Maintenance Rules

- Add new IDs sequentially; do not reuse old IDs.
- Keep this file and the feature matrix updated in the same PR when dashboard
  behavior or tests change.
- As each section migrates from `MOCK_DASHBOARD_DATA` to the overview API, add
  its cases here and update the migration table in `docs/dashboard/README.md`.
