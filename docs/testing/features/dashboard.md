# Dashboard Test Cases

## Scope

Static (mock-data-driven) dashboard UI at the protected home route
(`/(protected)/_layout/`). Pure frontend components under
`src/components/features/dashboard/**`: the purple profile-action banner, the
welcome greeting + promotional banner carousel, the schedule / pending-tasks
card, and the sidebar panels (announcements, product updates, LMS support).

No API is wired yet — `MOCK_DASHBOARD_DATA` feeds `DashboardPage`; swap it for
API data later without changing the presentational components.

## Test Files

- `src/components/features/dashboard/shared/scheduleUtils.test.tsx`
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

## How To Run

- Run only dashboard tests: `npm run test -- src/components/features/dashboard`
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
- `DASH-012` - Module: `DashboardPage` / `DashboardLayout` - Case: renders the full dashboard (welcome, banner action, schedule tabs, sidebar panels) from mock data - Status: Covered

## Maintenance Rules

- Add new IDs sequentially; do not reuse old IDs.
- Keep this file and the feature matrix updated in the same PR when dashboard
  behavior or tests change.
- Replace `MOCK_DASHBOARD_DATA` usage notes here once the dashboard is wired to
  a real API.
