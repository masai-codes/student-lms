# Announcements listing — filter drawer

Last updated: 2026-07-22

## Scope

The `/announcements` listing gains a Learn-style right-side **filter drawer**
(`MasaiDrawer`) replicating the old LMS announcements filter, alongside the
existing search box (`q`) and "Important for you" toggle (`message`). Four
filter sections (left-nav + content), matching the old LMS:

| Section | Control | Values |
|---|---|---|
| Type | checkboxes | `Critical` (`critical`), `Information` (`info`) — fixed |
| Category | checkboxes | non-deprecated `announcement-category` menu values |
| Announced by | checkboxes | distinct authors across the blended list — section announcement authors **and** message senders (value = user id) |
| Announced date | date range | IST calendar-day range on `schedule` (fallback `created_at`) |

- **Options** load once from `GET /api/announcement/filter-options`
  (`{ categories, announcers }`); the drawer and the applied chips share the
  cached query. Type is a fixed set.
- **URL-driven** — `type`, `category`, `announcedBy` (CSV arrays), `startDate`,
  `endDate`. The drawer keeps a draft and commits on Apply (deferred to the
  drawer's `onClosed`). Changing a filter resets `page` to 1 and preserves
  `q`/`message`.
- **Applied-filter chips** below the controls remove one value each (Type
  humanized, Announced-by shown as the author's name via the cached options);
  "Clear all" drops every filter. An active-count badge sits on the trigger.
- Filters apply to both blended sources — announcements (`a.type`/`a.category`/
  `a.user_id`/schedule) and messages (`meta.$.message_type`/`meta.$.category`/
  `m.author_id`/schedule) — via `buildAnnouncementFilterClauses`.
- Apply/clear fire `l_announcement_filter_apply` GTM events.

Shared with the bookmarks drawer: `FilterCheckboxColumn`
(`components/features/shared`) and `isIsoDate` (`@/lib/isIsoDate`).

## Test files

| File | Covers |
| --- | --- |
| `src/server/api/announcement/utils/__tests__/buildAnnouncementFilterClauses.test.ts` | type/category/announcedBy `IN` on both sources; schedule date range (BETWEEN/`>=`/`<=`) |
| `src/server/api/announcement/utils/__tests__/parseAnnouncementsQuery.test.ts` | defaults, csv parse, announcedBy + date validation |
| `src/server/api/announcement/__tests__/getAnnouncementFilterOptions.service.test.ts` | categories + section-scoped announcers; no sections; blank-name drop |
| `src/lib/api/announcement/__tests__/announcementApi.filters.test.ts` | param serialization (incl. announcedBy/dates); options fetch shape |
| `src/components/features/announcements/announcementFilterConfig.test.ts` | sections, type options, empty factory, `isIsoDate`, `normalizeFilterValues` |
| `src/components/features/announcements/announcementFilterSearch.test.ts` | search⇄filters, count, chips (type/announcer labels, removal, date) |
| `src/components/features/announcements/AnnouncementFiltersPanel.test.tsx` | nav sections, type/announced-by/date apply, clear |
| `src/components/features/announcements/AnnouncementFilterDrawer.test.tsx` | trigger open, count badge, deferred commit, GTM |
| `src/components/features/announcements/AnnouncementAppliedFilters.test.tsx` | chip render, announcer-name resolution, removal, clear-all, empty → null |
| `src/components/features/announcements/AnnouncementCard.test.tsx` | card routing/tint/badges |
| `src/components/features/announcements/AnnouncementsPage.test.tsx` | list/empty, apply/clear navigation, toggle preserves filters, debounced search, fetch params |

## Commands

```bash
npm run test -- src/components/features/announcements src/server/api/announcement src/lib/api/announcement
npm run lint
npx tsc --noEmit
```

## Manual QA

1. Open `/announcements`, click **Filters** — the drawer slides in with Type,
   Category, Announced by, Announced date sections.
2. Select values across sections, click Apply — the list filters, the URL gains
   the params, chips appear, and the count badge updates.
3. Remove a chip; click "Clear all" — filters clear.
4. Confirm "Important for you" and search still work and preserve active
   filters. Reload / back-forward restores filters from the URL.

Update this file and `feature-test-matrix.md` when the announcement filter
behavior or tests change.
