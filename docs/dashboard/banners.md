# Welcome banners

The promotional carousel shown beside the "Welcome, <name>" greeting.

- **Source of truth:** `banners` table (added to the Drizzle schema; mirrors the
  `experience-api` Prisma `banners` table).
- **Service:** `src/server/api/dashboard/banners/getWelcomeBanners.service.ts`
- **Pure rules:** `src/server/api/dashboard/banners/welcomeBannerVisibility.ts`
- **Served via:** `GET /api/dashboard/overview` → `banners`.

## Which banners a user sees

A banner is shown only if **all** of these pass, evaluated in order:

1. **Active & not deleted** (DB filter)
   `is_active = 1 AND deleted_at IS NULL`.

2. **Inside its time window** — "now" in **IST (UTC+5:30)** must be within
   `[start_date, end_date]`. Banner datetimes are stored as IST wall-clock with
   no zone, so we shift the current epoch by +5:30 (`getIstNowMs`) and parse the
   banner bounds into the same frame (`parseIstWallClock`) before comparing. A
   missing bound is treated as open on that side.

3. **Batch targeting** — `visible_to.batches` is either empty (everyone) or
   contains at least one of the user's enrolled batch ids. The user's batches
   come from the reusable `getBatchIdsForEnrolledUser(userId)` (via
   `section_user → sections.batch_id`, distinct).

4. **Group targeting** — `visible_to.random_group` is either empty (everyone) or
   contains the user's A/B/C/D bucket (`userId % 4`). Used for gradual rollouts.

5. **Banned-user cutoff** — if the user's account `status` is `banned`, banners
   **created or started strictly after** their ban time (`users.status_time`)
   are hidden. Non-banned users (or a banned user with no/invalid
   `status_time`) have no cutoff. Implemented by `bannedContent.ts`
   (`getBannedContentCutoff` + `isContentWithinBannedCutoff`).

Matching banners are returned **newest-first** (`created_at DESC`).

## Card UI (`WelcomeBannerCarousel`)

- **Icon** — circular white chip showing `imageUrl`, or the shared remote
  fallback SVG (`…/Group_f647b8c854.svg`) when null.
- **Title** — bold. **Description** — desktop only (`hidden md:block`); mobile
  shows just the title.
- **Swipe** — the carousel uses **embla** for smooth mouse/touch drag-to-swipe.
  A drag never triggers the banner link (the trailing click is swallowed).
- **Controls** — with >1 banner, bounded prev/next arrows (prev disabled on the
  first, next on the last — no wraparound) and a row of dot indicators
  (`data-active`, clickable). With exactly 1 banner there are no arrows/dots.
- **Click** — the whole banner is a link whose destination comes from `cta_url`:
  `/…` → internal (same tab); a full URL → new tab (`noopener noreferrer`); none
  → the Changemakers Circle route (`/changemakers-circle`). Every click pushes
  the GTM event `l_dashboard_banner_carousel_<analyticsKey>_id_<id>`, where
  `analyticsKey` is computed on the backend (group name, else `type_variant`).

## Rotation (client-side)

The API returns the full ordered list; it does **not** decide which banner shows
first. The UI remembers the last banner **id** in `localStorage`
(`dashboard_last_banner_id`) and starts one past it on each page load, so a
returning user sees a different banner over time (wrapping around). Manual
arrows override for the session and update the stored id. An unknown/missing id
starts at 0.

- Util: `src/components/features/dashboard/shared/bannerRotation.ts`
  (`computeNextBannerIndex`, `nextRotatedBannerIndex`, `rememberBannerId`).
- Consumed by: `WelcomeBannerCarousel` (lazy `useState` initializer, so rotation
  advances once per mount; persists the shown id via an effect). Storage
  failures fall back to index 0.

## `visible_to` JSON shape

```jsonc
{
  "batches": ["101", "102"], // empty/absent → all batches
  "random_group": ["A", "C"], // empty/absent → all groups
}
```

`parseBannerVisibility` tolerates a raw JSON string, an already-parsed object,
and malformed/null input (falls back to "visible to everyone").

## Tests

- `bannedContent.test.ts` — ban detection, cutoff resolution, content gating.
- `welcomeBannerVisibility.test.ts` — group bucket, `visible_to` parsing, batch
  and group matching, IST window math.
- `getWelcomeBanners.service.test.ts` — end-to-end filtering (window, batch,
  banned cutoff) with the DB + deps mocked.
- `getDashboardOverview.{service,handler}.test.ts` — composition + auth/error.
- `bannerRotation.test.ts` — index advancement, wrap-around, storage fallback.
