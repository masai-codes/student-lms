# Masaiverse Test Cases

## Scope

Current focus: server API/unit test coverage for `src/server/masaiverse/**`.

## Test Files

- `src/server/masaiverse/__tests__/visibility-and-banners.test.ts`
- `src/server/masaiverse/__tests__/membership-and-join.test.ts`
- `src/server/masaiverse/__tests__/listings.test.ts`
- `src/server/masaiverse/__tests__/community-auth.test.ts`
- `src/server/masaiverse/__tests__/testSetup.ts` (shared mocks and helpers)
- `src/server/api/masaiverse-v2/__tests__/markMasaiverseVisited.service.test.ts`
- `src/server/api/masaiverse-v2/__tests__/markMasaiverseVisited.handler.test.ts`
- `src/server/api/masaiverse-v2/__tests__/sectionOneStats.service.test.ts`
- `src/server/api/masaiverse-v2/__tests__/getMasaiverseV2Home.service.test.ts`
- `src/lib/dateRanges.test.ts` (shared IST week/year range helpers)
- `src/lib/masaiverseEventCard.test.ts` (IST event-card display helper)
- `src/server/api/masaiverse-v2/__tests__/getHomeEvents.service.test.ts`
- `src/server/api/masaiverse-v2/__tests__/getHomeHighlights.service.test.ts`
- `src/components/features/masaiverse-v2/pages/home/StatsSection.test.tsx`
- `src/components/features/masaiverse-v2/pages/home/EventCard.test.tsx`
- `src/components/features/masaiverse-v2/pages/home/ThisWeekSection.test.tsx`
- `src/components/features/masaiverse-v2/pages/home/HighlightCard.test.tsx`
- `src/components/features/masaiverse-v2/pages/home/HighlightsSection.test.tsx`

## How To Run

- Run only masaiverse API tests:
  - `npm run test -- src/server/masaiverse/__tests__`
- Run all tests:
  - `npm run test`

## Covered Test Cases

- `MASAIVE-API-001` - Module: `showMasaiversePage` - Case: returns `false` when user has no batch rows - Status: Covered
- `MASAIVE-API-002` - Module: `showMasaiversePage` - Case: returns `true` when any batch meta enables `show_masaiverse` - Status: Covered
- `MASAIVE-API-003` - Module: `fetchMasaiverseBanners` - Case: maps DB row shape and normalizes null/trimmed fields - Status: Covered
- `MASAIVE-API-004` - Module: `fetchMasaiverseBanners` - Case: throws stable server error on DB failure - Status: Covered
- `MASAIVE-API-005` - Module: `fetchMyEventEnrollments` - Case: returns empty array when user is not authenticated - Status: Covered
- `MASAIVE-API-006` - Module: `fetchMyEventEnrollments` - Case: returns enrolled event IDs for authenticated user - Status: Covered
- `MASAIVE-API-007` - Module: `fetchMyClubMembership` - Case: normalizes role and computes `isAltLead` - Status: Covered
- `MASAIVE-API-008` - Module: `joinClub` - Case: throws `UNAUTHORIZED` when no active user - Status: Covered
- `MASAIVE-API-009` - Module: `joinClub` - Case: returns already-joined response without insert - Status: Covered
- `MASAIVE-API-010` - Module: `joinEvent` - Case: enrolls new user-event relation when valid - Status: Covered
- `MASAIVE-API-011` - Module: `joinEvent` - Case: returns already-enrolled response without insert - Status: Covered
- `MASAIVE-API-012` - Module: `fetchAllClubs` - Case: returns clubs and normalizes `meta` fallback - Status: Covered
- `MASAIVE-API-013` - Module: `fetchAllClubs` - Case: throws stable error on DB failure - Status: Covered
- `MASAIVE-API-014` - Module: `fetchAllEvents` - Case: returns and ranks joined active events ahead of others - Status: Covered
- `MASAIVE-API-015` - Module: `fetchAllEvents` - Case: throws stable error when query fails - Status: Covered
- `MASAIVE-API-016` - Module: `fetchCommunityDiscussions` - Case: throws `UNAUTHORIZED` when no active user - Status: Covered
- `MASAIVE-API-017` - Module: `createCommunityPost` - Case: throws `UNAUTHORIZED` when no active user - Status: Covered
- `MASAIVE-API-018` - Module: `createCommunityReply` - Case: throws `UNAUTHORIZED` when no active user - Status: Covered
- `MASAIVE-API-019` - Module: `voteCommunityPost` - Case: throws `UNAUTHORIZED` when no active user - Status: Covered
- `MASAIVE-API-020` - Module: `voteCommunityReply` - Case: throws `UNAUTHORIZED` when no active user - Status: Covered
- `MASAIVE-API-021` - Module: `toggleCommunityPostBookmark` - Case: throws `UNAUTHORIZED` when no active user - Status: Covered
- `MASAIVE-V2-001` - Module: `markMasaiverseVisited` (service) - Case: issues a single guarded UPDATE for the given user - Status: Covered
- `MASAIVE-V2-002` - Module: `markMasaiverseVisited` (service) - Case: propagates DB errors to caller - Status: Covered
- `MASAIVE-V2-003` - Module: `handleMarkMasaiverseVisited` - Case: marks session user and returns `{ success: true }` - Status: Covered
- `MASAIVE-V2-004` - Module: `handleMarkMasaiverseVisited` - Case: returns 401 when no session user - Status: Covered
- `MASAIVE-V2-005` - Module: `handleMarkMasaiverseVisited` - Case: maps unexpected failures to 500 `SERVER_ERROR_MARKING_MASAIVERSE_VISITED` - Status: Covered
- `MASAIVE-V2-006` - Module: `dateRanges` - Case: current IST week spans Monday→Monday, using IST day at the boundary - Status: Covered
- `MASAIVE-V2-007` - Module: `dateRanges` - Case: current IST year spans Jan 1→Jan 1, using IST year at the boundary - Status: Covered
- `MASAIVE-V2-008` - Module: `getCommunityLearnerCount` - Case: returns distinct learner count, 0 when empty - Status: Covered
- `MASAIVE-V2-009` - Module: `getDiscussionsThisWeekCount` - Case: sums posts + replies this week, 0 when empty - Status: Covered
- `MASAIVE-V2-010` - Module: `getEventsThisYearCount` - Case: counts events scheduled this year, 0 when empty - Status: Covered
- `MASAIVE-V2-011` - Module: `getEventRegistrationsThisYearCount` - Case: counts registrations this year, 0 when empty - Status: Covered
- `MASAIVE-V2-012` - Module: `getMasaiverseV2Home` - Case: composes section-one stats and passes a single `now` to time-bounded services - Status: Covered
- `MASAIVE-V2-013` - Module: `StatsSection` (home UI) - Case: renders four labelled stat cards - Status: Covered
- `MASAIVE-V2-014` - Module: `StatsSection` (home UI) - Case: shows formatted counts from the home API on success - Status: Covered
- `MASAIVE-V2-015` - Module: `StatsSection` (home UI) - Case: falls back to a dash for every card on request failure - Status: Covered
- `MASAIVE-V2-016` - Module: `getHomeEvents` - Case: maps rows to card shape (image, meta aboveTitle/belowTitle, UTC ISO times); normalizes nulls; empty list - Status: Covered
- `MASAIVE-V2-017` - Module: `getMasaiverseV2Home` - Case: includes section-two events and passes `now` to `getHomeEvents` - Status: Covered
- `MASAIVE-V2-018` - Module: `getEventCardDisplay` - Case: IST LIVE / TODAY / TOMORROW / start-time badge + date box, missing-time fallback - Status: Covered
- `MASAIVE-V2-019` - Module: `EventCard` (home UI) - Case: renders image + 3 lines, LIVE badge, omits optional bits when absent - Status: Covered
- `MASAIVE-V2-020` - Module: `ThisWeekSection` (home UI) - Case: loading message, event cards + count, empty state, Swiper carousel navigation shown only when >1 event - Status: Covered
- `MASAIVE-V2-021` - Module: `getLastWeekRangeIst` - Case: previous IST week is the seven days before the current week - Status: Covered
- `MASAIVE-V2-022` - Module: `getHomeHighlights` - Case: maps last-week events to recap cards (aboveTitle/title/belowTitle + pastEventEmojiValue); normalizes nulls; empty list - Status: Covered
- `MASAIVE-V2-023` - Module: `getMasaiverseV2Home` - Case: includes section-three highlights and passes `now` to `getHomeHighlights` - Status: Covered
- `MASAIVE-V2-024` - Module: `HighlightCard` (home UI) - Case: renders emoji + 3 lines, omits optional bits when absent - Status: Covered
- `MASAIVE-V2-025` - Module: `HighlightsSection` (home UI) - Case: loading message, recap cards, empty state - Status: Covered

## Pending / Next Cases

- `MASAIVE-API-022` - Module: `joinClub` - Case: invalid club id input should throw `INVALID_CLUB_ID` - Status: Planned
- `MASAIVE-API-023` - Module: `joinClub` - Case: unknown club should throw `CLUB_NOT_FOUND` - Status: Planned
- `MASAIVE-API-024` - Module: `joinEvent` - Case: invalid event id input should throw `INVALID_EVENT_ID` - Status: Planned
- `MASAIVE-API-025` - Module: `joinEvent` - Case: unknown event should throw `EVENT_NOT_FOUND` - Status: Planned
- `MASAIVE-API-026` - Module: `fetchCommunityDiscussions` - Case: joined-club success path with mapped posts/replies/votes/bookmarks - Status: Planned
- `MASAIVE-API-027` - Module: `createCommunityPost` - Case: content validation and successful insert flow - Status: Planned
- `MASAIVE-API-028` - Module: `createCommunityReply` - Case: post-club validation and notification fallback behavior - Status: Planned
- `MASAIVE-API-029` - Module: `voteCommunityPost` - Case: vote toggle/update flows and upvote notification behavior - Status: Planned
- `MASAIVE-API-030` - Module: `voteCommunityReply` - Case: insert/delete/update vote flows - Status: Planned
- `MASAIVE-API-031` - Module: `toggleCommunityPostBookmark` - Case: bookmark insert/delete toggle behavior - Status: Planned

## Maintenance Rules

- Add new IDs sequentially; do not reuse old IDs.
- Keep this file updated in the same PR when:
  - API behavior changes
  - new tests are added
  - existing tests are removed/renamed
- If a test case moves to another file, update both the row and `Test Files` section.
