# Bookmarks listing — filter drawer

Last updated: 2026-07-22

## Scope

The `/bookmarks` listing gains a Learn-style right-side **filter drawer**
(`MasaiDrawer`) alongside the existing tabs + search box. The old LMS bookmarks
drawer only exposed a single date filter; this is a richer, data-grounded
version whose filters map to columns each tab already returns.

Per-tab filters:

| Tab | Filters |
|---|---|
| Lectures | Category, Module, Type (Lecture / Resource), Saved date |
| Assignments | Category, Module, Saved date |
| Tickets | Status, Priority, Category, Saved date |
| Announcements | Category, Type (Critical / Information), Saved date |
| Masaiverse | Saved date only |

- **Options are dynamic** — Category/Module/Status/Priority values come from the
  user's own bookmarked items via `GET /api/bookmarks/filter-options?tab=…`
  (distinct, sorted). Type is a fixed set. Masaiverse posts have no filterable
  columns.
- **URL-driven** — selections live in search params (`category`, `module`,
  `type`, `status`, `priority`, `startDate`, `endDate`); the drawer keeps a
  draft and commits on Apply (deferred to the drawer's `onClosed` so the list
  doesn't flash a refetch). Clear all removes every filter param.
- **Applied-filter chips** render below the controls; each chip removes one
  value, plus a "Clear all". An active-count badge sits on the trigger.
- Switching tabs resets search + all filters (a fresh view), matching the
  existing tab behavior.
- Saved date filters on the bookmark-creation timestamp compared as an IST
  calendar day (`buildSavedDateClause`), applied across all tabs (incl.
  Masaiverse on `club_post_bookmarks.created_at`).
- Apply/clear fire `l_bookmarks_filter_apply` GTM events.

## Test files

| File | Covers |
| --- | --- |
| `src/server/api/bookmarks/utils/__tests__/buildBookmarkFilterClauses.test.ts` | `IN` clause building, lecture type (both/neither/resource/lecture), saved-date BETWEEN/`>=`/`<=`/empty |
| `src/server/api/bookmarks/utils/__tests__/parseBookmarksQuery.test.ts` | defaults, tab fallback, CSV parse/dedupe, date validation |
| `src/server/api/bookmarks/__tests__/getBookmarkFilterOptions.service.test.ts` | distinct/sorted options per tab; empty (masaiverse) without a query |
| `src/components/features/bookmarks/bookmarksFilterConfig.test.ts` | empty-state factory, per-tab sections, type options, `isIsoDate`, `normalizeFilterValues` |
| `src/components/features/bookmarks/bookmarksFilterSearch.test.ts` | search⇄filters round-trip, count, chips (labels, removal, date ranges) |
| `src/lib/api/bookmarks/__tests__/bookmarksApi.filters.test.ts` | param serialization; filter-options fetch |
| `src/components/features/bookmarks/BookmarksFiltersPanel.test.tsx` | nav per tab, toggle + apply, type section, date range, clear |
| `src/components/features/bookmarks/BookmarksFilterDrawer.test.tsx` | trigger open, count badge, deferred commit via `onClosed`, GTM |
| `src/components/features/bookmarks/BookmarksAppliedFilters.test.tsx` | chip render, single removal, clear-all, empty → null |
| `src/components/features/bookmarks/BookmarkCard.test.tsx` | title/author/href/testid, For-you badge, all entity types |
| `src/components/features/bookmarks/BookmarksPage.test.tsx` | list/empty render, apply/clear navigation, tab reset, fetch params |

## Commands

```bash
npm run test -- src/components/features/bookmarks src/server/api/bookmarks src/lib/api/bookmarks
npm run lint
npx tsc --noEmit
```

## Manual QA

1. Open `/bookmarks`, click the filter icon — the drawer slides in from the
   right with the tab's sections in the left nav.
2. Select values in one or more sections; click Apply. The drawer closes, the
   list filters, the URL gains the params, chips appear, and the count badge
   updates.
3. Remove a chip — that value drops; click "Clear all" — all filters clear.
4. Switch tabs — search + filters reset; confirm each tab shows only its
   relevant sections (Masaiverse shows only Saved date).
5. Reload / browser back-forward — active filters restore from the URL.

Update this file and `feature-test-matrix.md` when the bookmarks filter
behavior or tests change.
