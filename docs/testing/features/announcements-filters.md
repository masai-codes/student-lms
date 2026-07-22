# Announcements listing — Type & Category filters

Last updated: 2026-07-22

## Scope

The `/announcements` listing (`AnnouncementsPage`) gains parity with the old LMS
filter bar. Alongside the existing search box (`q`) and "Important for you"
toggle (`message`), it now offers two multi-select dropdown filters:

- **Type** — fixed options `Critical` (`critical`) and `Information` (`info`),
  matching the old LMS student filter (which intentionally exposes only these
  two of the stored types).
- **Category** — options loaded from the `menus` table
  (`category = 'announcement-category'`, non-deprecated), via
  `GET /api/announcement/filter-options`. The dropdown is hidden when no
  categories are configured.

Selections live in the URL search params (`type`, `category` — string arrays)
so filters are shareable/back-forward safe. Changing any filter resets `page`
to 1 and preserves the other params. A **Clear** control appears when any filter
is active. Every control fires a GTM event (`l_announcement_filter_*`).

Backend: `parseAnnouncementsQuery` reads comma-separated `type`/`category`
params into deduped arrays; `buildAnnouncementFilterClauses` produces
parameterized `IN (…)` WHERE fragments applied to both blended sources —
`announcements` (`a.type` / `a.category`) and `messages`
(`meta.$.message_type` / `meta.$.category`), mirroring the old LMS resolver.

## Test files

| File                                                                                    | Covers                                                                          |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/server/api/announcement/utils/__tests__/buildAnnouncementFilterClauses.test.ts`    | Empty → empty fragment; parameterized `IN` for types/categories on both sources; combined ordering |
| `src/server/api/announcement/utils/__tests__/parseAnnouncementsQuery.test.ts`           | Defaults, page/limit/q/message parsing, invalid fallbacks, CSV type/category dedupe + trim, empty params |
| `src/server/api/announcement/__tests__/getAnnouncementFilterOptions.service.test.ts`    | Menu rows → deduped category values; empty-value drop / empty result           |
| `src/lib/api/announcement/__tests__/announcementApi.filters.test.ts`                    | Param serialization (omit when empty, comma-join when set); filter-options fetch |
| `src/components/features/announcements/announcementFilterConfig.test.ts`                | Type option set; `normalizeFilterValues` (single/array/dedupe/invalid → undefined) |
| `src/components/features/announcements/AnnouncementFilters.test.tsx`                     | Type renders; Category shows/hides on options; GTM + onChange for type/category/clear |
| `src/components/features/announcements/AnnouncementCard.test.tsx`                        | Announcement vs message routing; critical tint; unread dot + For-you badge; empty author |
| `src/components/features/announcements/AnnouncementsPage.test.tsx`                       | List/empty render; filter apply/clear navigation (page reset); toggle preserves filters; debounced search; fetch params |

## Commands

```bash
npm run test -- src/components/features/announcements src/server/api/announcement src/lib/api/announcement
npm run lint
npx tsc --noEmit
```

## Manual QA

1. Open `/announcements`. Select one or more **Type** options — the list filters
   and the URL gains `type=…`; the count badge shows the number selected.
2. Select **Category** options — the list filters and `category=…` is added.
   Confirm the Category dropdown is absent if no categories are configured.
3. Confirm changing a filter resets to page 1 and keeps the search text and
   "Important for you" state.
4. Click **Clear** — all filter params drop from the URL and the full list
   returns.
5. Reload / use browser back-forward — the active filters restore from the URL.

Update this file and `feature-test-matrix.md` when the announcement listing
filter behavior or tests change.
