# Masaiverse event rendering and ordering

This document describes how events are loaded, ordered, and shown on the Masaiverse **Home** and **Events** tabs in `student-lms-experience` (for example `http://localhost:3002/masaiverse?tab=home` and `?tab=events`).

## Routing

The `/masaiverse` route resolves the main content from the `tab` search param:

| URL / `tab` value | Component |
|-------------------|-----------|
| `tab=home`, invalid/missing `tab` | `HomeSection` |
| `tab=events` | `EventsSection` |

Defined in `src/routes/(protected)/_layout/masaiverse/index.tsx`.

## Shared data source

Both tabs load the same event list from the server function **`fetchAllEvents`** (`src/server/masaiverse/fetchEvents.ts`).

- **Home** (`HomeSection.tsx`): calls `fetchAllEvents()` with no arguments (no search).
- **Events** (`EventsSection.tsx`): calls `fetchAllEvents({ data: { searchQuery } })` when the debounced search string is non-empty; otherwise same as home.

Enrollment state comes from **`fetchMyEventEnrollments`** in parallel; it affects CTAs (“Enroll” vs “Enrolled” / link) and **not** the sort order of the list.

## Visibility (which events appear at all)

Before ordering, the query restricts which rows are returned:

1. **User has at least one club membership**  
   Events where `clubId` is **null** (global) **or** `clubId` is in the set of clubs the user has joined.

2. **User has no club membership**  
   Only events where `clubId` is **null** (global events).

The database query also applies `orderBy(asc(startTime), asc(createdAt))`, but the **final order shown in the UI** comes from the in-memory sort below (the DB order is only an intermediate step).

## Event order (authoritative)

After fetching, `fetchAllEventsHandler` sorts a copy of the array with this logic:

### 1. Primary buckets (rank)

For each event, using “now” = server time when the handler runs:

| Rank | Meaning |
|------|--------|
| **0** | Event is **not ended** (`endTime` is finite and ≥ now) **and** its `clubId` is one of the user’s **joined** clubs |
| **1** | Event is **not ended** but is **not** in rank 0 (e.g. global `clubId === null`, or not a joined-club event in the allowed set) |
| **2** | Event is **ended** (`endTime` is finite and &lt; now) |

Sort key: **lower rank first** → active joined-club events first, then other active events, then ended events.

### 2. Tie-breakers (within the same rank)

1. **`startTime`** ascending (earlier first). Missing / unparseable times sort as +∞ (end of the bucket).
2. If still tied: **`createdAt`** ascending (older first).

This matches the intent described in tests: an active event for a joined club can appear **before** another active event with an earlier `startTime` if the latter is not a “joined club” event (see `src/server/masaiverse/__tests__/listings.test.ts`).

## How each tab uses that order

### `tab=home` — “This Week on MasaiVerse”

Component: `HomeEventsPreview.tsx`, fed by `HomeSection` with the full `eventsList` from `fetchAllEvents`.

- The UI shows at most **the first two events** in the sorted list: `eventsList.slice(0, 2)`.
- They are rendered in a **Swiper** carousel (same order as the array: first slide = highest priority per rules above).
- **“View all”** is shown only when `eventsList.length > 1`; it navigates to `/masaiverse?tab=events`.
- Empty state: “No events available right now.”

So **home order = server sort order, truncated to two items**.

### `tab=events` — full Events page

Component: `EventsSection.tsx`.

- Renders the full `eventsList` **after** optional **category** filter:
  - Tab **All**: same order as `eventsList`.
  - A **specific category** tab: `eventsList.filter(event => event.category === activeCategory)` — **order within that category is preserved** from the server list (not re-sorted by category name).
- **Search**: debounced input refetches from the server with `searchQuery`; ordering rules are the same on the new result set (title filter: SQL `LIKE` on `events.title`).
- Layout: responsive **grid** of `EventCard`s in array order (row-major in CSS grid).

### Card content (not order)

`mapEventToCardProps` in `MasaiverseSections/cardDataMappers.ts` maps DB fields to card props (title, date/time in `Asia/Kolkata`, images, `meta.is_active`, etc.). That affects presentation and “active” styling hints, **not** the list ordering (ordering uses `startTime` / `createdAt` / ended / joined-club as above).

## Quick reference

| Concern | Where it happens |
|--------|-------------------|
| Tab → screen | `masaiverse/index.tsx` |
| Fetch + sort | `fetchEvents.ts` → `fetchAllEventsHandler` |
| Home: top 2 only | `HomeEventsPreview.tsx` → `slice(0, 2)` |
| Events: category filter | `EventsSection.tsx` → `filteredEvents` |
| Events: search | `EventsSection.tsx` → `fetchAllEvents({ searchQuery })` |
| Past vs future for CTAs | Both sections: `eventDbTimestampToMs(endTime) < Date.now()` → treat as past for enroll CTA |
