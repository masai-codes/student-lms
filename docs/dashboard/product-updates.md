# Product Updates section

The sidebar "Product Updates" panel. Served via `GET /api/dashboard/overview` →
`productUpdates`.

- **Service:** `src/server/api/dashboard/product-updates/getProductUpdates.service.ts`
- **Source:** the global `whatsnew` table.

## Logic

Product updates are the **newest global `whatsnew` rows** — the same for
everyone. There is **no batch, section, or read targeting** (unlike
announcements). The only filter is the banned-content cutoff.

1. **Newest-first** — ordered by `created_at DESC`.
2. **Paginated** — `limit` (default `PRODUCT_UPDATES_PAGE_SIZE = 25`) + `offset`,
   so the backend serves 25/page.
3. **Banned cutoff** — for banned users, updates created after their ban time
   are hidden (`getBannedContentCutoffForUser` + `isContentWithinBannedCutoff`,
   the same reusable pieces the banner/announcement feeds use). Non-banned users
   see everything.

The dashboard card shows the **top 5**: the overview service fetches a page and
slices `DASHBOARD_PRODUCT_UPDATES_LIMIT = 5`.

Each row maps to `{ id, title (from subject), imageUrl (from image) }`.

## Card UI (`ProductUpdatesPanel`)

- Header **"Product Updates"** + a **"View All"** button (→ `/whats-new`).
- Up to 5 rows in a fixed-height **scrollable** body. Each row: a check-seal
  icon, the update title, and a right-caret.
- **Click** — a row links to `/whats-new/$id` and pushes the GTM event
  `l_whats_new`.
- **States** (from the shared overview query): loading → spinner + "Loading…";
  error → "Failed to load content"; empty → header + View All + "No content
  available".

## Notes

- `whatsnew` has no `deleted_at`, schedule/publish, or targeting columns — it's a
  flat global list, which is why this is the simplest of the dashboard feeds.
- The banned cutoff is applied in JS (consistent with the other feeds). Because
  results are newest-first, hidden items are always the newest prefix, so the
  dashboard's top-5 (taken from a 25-row page) is correct for realistic data; a
  fully paginated "View all" page for a banned user with >20 post-ban updates
  would want the cutoff pushed into SQL.
- The older top-5-only `src/server/api/dashboard/getProductUpdates.service.ts`
  (no cutoff, used by the legacy `right-section` endpoint) is superseded by this
  and can be retired once that route is migrated.
