# Dashboard

Living documentation for the student dashboard — both the UI and the data/logic
behind it. The dashboard is being migrated **section by section** from static
mock UI to live, API-driven data. This folder records the logic as we implement
it so it can be referenced later.

## Architecture principle

> The API computes, applies all business logic, and returns ready-to-render
> data. The frontend only displays it.

To keep this maintainable, backend logic is built from **small, single-purpose,
reusable modules** (pure utils + thin services) that the API composes like
tools. A section's endpoint is a thin orchestrator over these pieces.

## The consolidated overview endpoint

`GET /api/dashboard/overview` returns everything the dashboard needs in one
payload. It is authenticated (session cookie → `requireSessionUserId`).

Layering:

```
route: src/routes/api/dashboard/overview.ts
  └─ handler: getDashboardOverview.handler.ts        (auth + error mapping)
       └─ service: getDashboardOverview.service.ts   (composition only)
            ├─ getWelcomeBanners.service.ts          (one field per service)
            │    ├─ getBatchIdsForEnrolledUser()     (reusable: user → batches)
            │    ├─ getBannedContentCutoffForUser()  (reusable: ban cutoff)
            │    └─ welcomeBannerVisibility.ts       (pure visibility rules)
            ├─ getAnnouncementsFeed.service.ts       (Feed A + Feed B → top 5)
            │    ├─ getSectionIdsForUser()           (reusable: user → sections)
            │    ├─ getBannedContentCutoffForUser()  (reusable: ban cutoff)
            │    ├─ getIstNowSqlDatetime()           (reusable: IST clock)
            │    └─ announcementFeed.ts              (pure combine/sort/cap)
            ├─ getProductUpdates.service.ts          (newest whatsnew, 25/page → top 5)
            │    └─ getBannedContentCutoffForUser()  (reusable: ban cutoff)
            └─ getSupportSessions.service.ts         (help sessions, next ~8 days)
                 ├─ getBannedContentCutoffForUser()  (reusable: ban cutoff)
                 ├─ getIstDayWindow() / formatIstWallClock()  (reusable: IST clock)
                 ├─ supportSessionStatus.ts          (pure live/today/upcoming)
                 └─ featuredSupportSession.ts        (pure: pick the one card)
```

Response shape (grows as sections are migrated):

```jsonc
{
  "banners": [
    { "id": 1, "title": "…", "description": "…", "imageUrl": "…", "ctaUrl": "…" }
  ],
  "announcements": [
    { "id": 2, "source": "a", "title": "…", "body": "…", "authorName": "…",
      "isForYou": false, "ctaName": null, "ctaLink": null }
  ],
  "productUpdates": [
    { "id": 3, "title": "…", "imageUrl": null }
  ],
  "supportSession": {
    "id": 4, "title": "…", "schedule": "2026-07-02T15:00:00+05:30",
    "concludes": "2026-07-02T16:00:00+05:30", "zoomLink": "…", "status": "live"
  }
}
```

`supportSession` is a single featured session or `null` (card hidden).

Client access: `fetchDashboardOverview()` in
`src/lib/api/dashboard/dashboardApi.ts`.

## Migration status

| Section              | Status  | Notes                                         |
| -------------------- | ------- | --------------------------------------------- |
| Welcome banners      | ✅ Live  | See [banners.md](./banners.md)                |
| Announcements        | ✅ Live  | See [announcements.md](./announcements.md)     |
| Product updates      | ✅ Live  | See [product-updates.md](./product-updates.md) |
| Support sessions     | ✅ Live  | See [support-sessions.md](./support-sessions.md) |
| Schedule             | ⬜ Mock  | Static in `shared/mockData.ts`                |
| Pending tasks        | ⬜ Mock  | Static                                        |
| Profile action banner| ⬜ Mock  | Static                                        |

The frontend `DashboardPage` merges live data over the mock defaults, so a
section keeps rendering from mock data until its API field lands.

## Automation test hooks (`data-testid`)

Every dashboard UI element carries a stable, kebab-case, `dashboard-`-prefixed
`data-testid` so automation suites can target it without depending on copy or
structure. Repeated list items reuse one id, suffixed with a stable domain id
where one exists. Current catalog:

| `data-testid`                          | Element                                   |
| -------------------------------------- | ----------------------------------------- |
| `dashboard-root` / `dashboard-content` | Page wrapper / white content card         |
| `dashboard-profile-action-banner`      | Purple profile banner root                |
| `dashboard-profile-action-label`       | Banner prompt text                         |
| `dashboard-profile-action-button`      | "Take Photo" button                       |
| `dashboard-profile-banner-prev/next`   | Banner nav arrows                         |
| `dashboard-welcome-section`            | Welcome greeting + carousel row           |
| `dashboard-welcome-name`               | Student name heading                      |
| `dashboard-welcome-banner-carousel`    | Promotional carousel container (absent with 0 banners) |
| `dashboard-welcome-banner-item`        | The shown banner (the clickable link)     |
| `dashboard-welcome-banner-prev/next`   | Bounded carousel arrows (>1 banner)       |
| `dashboard-welcome-banner-dot`         | Dot indicators (`data-active`; >1 banner) |
| `dashboard-schedule-section`           | Schedule card root                        |
| `dashboard-schedule-tab`               | "My Schedule" tab                         |
| `dashboard-pending-tasks-tab`          | "Pending Tasks" tab                       |
| `dashboard-pending-tasks-count`        | Pending-tasks count badge                 |
| `dashboard-schedule-feed`              | Schedule feed container                   |
| `dashboard-schedule-empty`             | Empty-schedule message                    |
| `dashboard-pending-tasks-empty`        | Empty-tasks message                       |
| `dashboard-schedule-week-<id>`         | A week group (`-label` for its heading)   |
| `dashboard-schedule-day-<id>`          | A day row (`-badge` for the date badge)   |
| `dashboard-schedule-card-<id>`         | A schedule card (`-title` for its title)  |
| `dashboard-sidebar`                    | Right-hand sidebar column                 |
| `dashboard-announcements-panel`        | Announcements panel (`-title`, `-view-all`, `-loading`, `-error`, `-empty`) |
| `dashboard-announcement-item-<source>-<id>` | An announcement/message row (`dashboard-announcement-for-you` badge on messages) |
| `dashboard-product-updates-panel`      | Product updates panel (`-title`, `-view-all`, `-loading`, `-error`, `-empty`) |
| `dashboard-product-update-item-<id>`   | A product update row                      |
| `dashboard-lms-support-panel`          | Support session card (hidden while loading / when none; `data-status` = live/today/upcoming) |
| `dashboard-support-session-time`       | Yellow IST time pill (today / upcoming)   |
| `dashboard-support-session-join`       | "Join Now" button (live sessions only)    |

When adding UI, follow the convention in `.cursor/rules/project-coding-guidelines.mdc`
(Automation Test Hooks) and extend this table.

## Assets

- `/lmssupportsession.svg` — support session card illustration (copied from
  `experience-ui`).
- Welcome-banner icon fallback (when a banner has no `image_url`) is the shared
  remote asset `…/Group_f647b8c854.svg`, matching `experience-ui`.

Note `/changemakers-circle` (banner no-`cta_url` fallback) has **no route** in
this app yet.

## Reusable building blocks (shared beyond the dashboard)

- **`getBatchIdsForEnrolledUser(userId)`** — `src/server/batches/`. Resolves the
  distinct batch ids a user belongs to via `section_user → sections.batch_id`.
  This is *the* answer to "which batches is this user in?" — reuse it, don't
  re-query.
- **`getSectionIdsForUser(userId)`** — `src/server/batches/`. The distinct
  section ids a user belongs to (`section_user → sections`, non-deleted). The
  "which sections am I in?" primitive.
- **`bannedContent.ts`** — `src/server/users/`. Single cohesive util for
  banned-user content gating (`isBannedUser`, `getBannedContentCutoff`,
  `isContentWithinBannedCutoff`). Replaces the two scattered
  `isBannedUser` / `getBannedContentCutoff` snippets.
- **`getBannedContentCutoffForUser(userId)`** — `src/server/users/`. Loads a
  user's status and returns their ban cutoff (or `null`) in one call. Used by
  both the banner and announcement feeds.
- **`istClock.ts`** — `src/server/time/`. IST (UTC+5:30) helpers for IST-stored
  DATETIME columns: `getIstNowSqlDatetime(now)` ("now" as a comparable wall-clock
  string), `getIstDayWindow(now, days)` (start-of-today → end-of-day-N range),
  and `formatIstWallClock(value)` (wall-clock → `…+05:30` ISO). No raw
  `CONVERT_TZ`.
