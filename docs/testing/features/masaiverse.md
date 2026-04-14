# Masaiverse Test Cases

## Scope

Current focus: server API/unit test coverage for `src/server/masaiverse/**`.

## Test Files

- `src/server/masaiverse/__tests__/visibility-and-banners.test.ts`
- `src/server/masaiverse/__tests__/membership-and-join.test.ts`
- `src/server/masaiverse/__tests__/listings.test.ts`
- `src/server/masaiverse/__tests__/community-auth.test.ts`
- `src/server/masaiverse/__tests__/testSetup.ts` (shared mocks and helpers)

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
