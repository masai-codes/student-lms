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
- `src/server/api/masaiverse-v2/__tests__/getHomeClubs.service.test.ts`
- `src/server/api/masaiverse-v2/__tests__/getCommunityDiscussions.service.test.ts`
- `src/server/api/masaiverse-v2/__tests__/createCommunityDiscussion.service.test.ts`
- `src/server/api/masaiverse-v2/__tests__/createCommunityDiscussion.handler.test.ts`
- `src/lib/initials.test.ts`
- `src/lib/discussionTags.test.ts`
- `src/lib/html.test.ts`
- `src/server/api/masaiverse-v2/__tests__/voteCommunityDiscussion.service.test.ts`
- `src/server/api/masaiverse-v2/__tests__/discussionReplies.service.test.ts`
- `src/server/api/masaiverse-v2/__tests__/discussionInteractions.handler.test.ts` (vote post/reply, list discussions, replies list/create)
- `src/components/features/masaiverse-v2/pages/home/StatsSection.test.tsx`
- `src/components/features/masaiverse-v2/pages/home/EventCard.test.tsx`
- `src/components/features/masaiverse-v2/pages/home/ThisWeekSection.test.tsx`
- `src/components/features/masaiverse-v2/pages/home/HighlightCard.test.tsx`
- `src/components/features/masaiverse-v2/pages/home/HighlightsSection.test.tsx`
- `src/components/features/masaiverse-v2/pages/home/HomeClubCard.test.tsx`
- `src/components/features/masaiverse-v2/pages/home/ActiveClubsSection.test.tsx`
- `src/components/features/masaiverse-v2/pages/home/DiscussionComposer.test.tsx`
- `src/components/features/masaiverse-v2/pages/home/CommunityDiscussionsSection.test.tsx`
- `src/components/features/masaiverse-v2/pages/home/DiscussionTags.test.tsx`
- `src/components/features/masaiverse-v2/pages/home/DiscussionVotes.test.tsx`
- `src/components/features/masaiverse-v2/pages/home/DiscussionReplies.test.tsx`
- `src/server/api/masaiverse-v2/__tests__/getMyClubs.service.test.ts`
- `src/server/api/masaiverse-v2/__tests__/getClubDetail.service.test.ts`
- `src/server/api/masaiverse-v2/__tests__/setClubMembership.service.test.ts`
- `src/components/features/masaiverse-v2/MyClubsSection.test.tsx`
- `src/components/features/masaiverse-v2/pages/ClubDetailPage.test.tsx`
- `src/components/features/masaiverse-v2/pages/club/ClubDetailBanner.test.tsx`
- `src/components/features/masaiverse-v2/pages/club/JoinClubButton.test.tsx`
- `src/components/features/masaiverse-v2/pages/club/ShareClubButton.test.tsx`

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
- `MASAIVE-V2-026` - Module: `getHomeClubs` - Case: maps clubs with member counts + capped name sample; skips member queries when no clubs - Status: Covered
- `MASAIVE-V2-027` - Module: `getMasaiverseV2Home` - Case: includes section-four clubs - Status: Covered
- `MASAIVE-V2-028` - Module: `HomeClubCard` (home UI) - Case: image/name/descriptions/member initials + count, name-initial fallback, "+" chip logic - Status: Covered
- `MASAIVE-V2-029` - Module: `ActiveClubsSection` (home UI) - Case: loading message, club cards, empty state - Status: Covered
- `MASAIVE-V2-030` - Module: `getCommunityDiscussions` - Case: maps club-less posts with author + upvote/reply counts; empty list skips count queries - Status: Covered
- `MASAIVE-V2-031` - Module: `createCommunityDiscussion` - Case: inserts club-less post and returns id; rejects empty title/content (400) without inserting - Status: Covered
- `MASAIVE-V2-032` - Module: `handleCreateCommunityDiscussion` - Case: 201 success, 401 unauth, validation ApiError passthrough, 500 on unexpected - Status: Covered
- `MASAIVE-V2-033` - Module: `getMasaiverseV2Home` - Case: includes section-five discussions - Status: Covered
- `MASAIVE-V2-034` - Module: `getInitials` - Case: two-word, single-word, and empty-name initials - Status: Covered
- `MASAIVE-V2-035` - Module: `DiscussionComposer` (home UI) - Case: Post gated until title+content; submits trimmed title + content and closes; shows error and stays open on failure - Status: Covered
- `MASAIVE-V2-036` - Module: `CommunityDiscussionsSection` (home UI) - Case: loading, discussion rows, empty state, opens composer on "Start a discussion", renders tag pills - Status: Covered
- `MASAIVE-V2-037` - Module: `discussionTags` - Case: parse comma input (trim/dedupe), serialize+parse round-trip, no-tags passthrough, marker sanitization - Status: Covered
- `MASAIVE-V2-038` - Module: `htmlPlainText` - Case: strips tags/entities; empty paragraph → empty - Status: Covered
- `MASAIVE-V2-039` - Module: `DiscussionTags` (UI) - Case: pill per tag, nothing when empty, stable color per tag - Status: Covered
- `MASAIVE-V2-040` - Module: `getCommunityDiscussions` - Case: extracts tags from content marker (and empty when none) - Status: Covered
- `MASAIVE-V2-041` - Module: `createCommunityDiscussion` / handler - Case: tags appended behind content marker; non-string tags filtered - Status: Covered
- `MASAIVE-V2-042` - Module: `voteCommunityDiscussion` - Case: insert/toggle-off/switch vote, upvote-count recompute, invalid post id/vote - Status: Covered
- `MASAIVE-V2-043` - Module: `getDiscussionReplies` / `createDiscussionReply` - Case: maps replies (UTC ISO); inserts reply; rejects empty content / invalid post id - Status: Covered
- `MASAIVE-V2-044` - Module: vote/replies handlers - Case: vote returns state, replies list by query postId, create reply 201, 401 unauth, ApiError passthrough - Status: Covered
- `MASAIVE-V2-045` - Module: `getCommunityDiscussions` - Case: returns the signed-in user's `myVote` per post - Status: Covered
- `MASAIVE-V2-046` - Module: `DiscussionVotes` (UI) - Case: shows only upvote count; casting an upvote updates cached count + myVote - Status: Covered
- `MASAIVE-V2-047` - Module: `DiscussionReplies` (UI) - Case: renders fetched replies (with per-reply vote control); posts a reply and clears the box - Status: Covered
- `MASAIVE-V2-048` - Module: `voteDiscussionReply` / vote handler - Case: votes on a reply via `replyId`; handler routes replyId→reply, else post - Status: Covered
- `MASAIVE-V2-049` - Module: `getDiscussionReplies` - Case: returns per-reply upvotes + the user's vote - Status: Covered
- `MASAIVE-V2-050` - Module: `getCommunityDiscussions` (paginated) - Case: returns `{discussions, hasMore}`; flags hasMore via limit+1 probe; empty page - Status: Covered
- `MASAIVE-V2-051` - Module: `handleListCommunityDiscussions` - Case: parses offset/limit and returns the page - Status: Covered
- `MASAIVE-V2-052` - Module: `CommunityDiscussionsSection` (UI) - Case: infinite list; "Load more" fetches next page at offset; hidden when no more - Status: Covered
- `MASAIVE-V2-053` - Module: `getCommunityDiscussions` (search) - Case: AND-of-terms match on title/content (covers tags), LIKE wildcards escaped - Status: Covered
- `MASAIVE-V2-054` - Module: `handleListCommunityDiscussions` - Case: passes `q` search param through - Status: Covered
- `MASAIVE-V2-055` - Module: `CommunityDiscussionsSection` (UI) - Case: debounced search re-queries with the typed term from offset 0 - Status: Covered
- `MASAIVE-V2-056` - Module: `getMyClubs` - Case: maps a user's joined clubs (imageUrl prefers `meta.cardImageLink`, falls back to `clubs.image`, null otherwise); empty list when none - Status: Covered
- `MASAIVE-V2-057` - Module: `getClubDetail` - Case: null for non-finite/unknown id; maps banner subtitle (`belowTitleCardText` fallback), filters non-string banner tags, live member count and joined state - Status: Covered
- `MASAIVE-V2-058` - Module: `setClubMembership` - Case: rejects invalid id (400) / unknown club (404); join is idempotent, leave deletes; returns `{isJoined, memberCount}` - Status: Covered
- `MASAIVE-V2-059` - Module: `MyClubsSection` / `MasaiverseV2LeftSection` (UI) - Case: live "My Clubs" list (image vs initials), loading skeleton, empty state - Status: Covered
- `MASAIVE-V2-060` - Module: `ClubDetailBanner` (UI) - Case: title/subtitle/image-or-initials; pill row is `[first meta tag, member count, …rest tags]`; member pill shown even with no meta tags - Status: Covered
- `MASAIVE-V2-061` - Module: `JoinClubButton` / `ShareClubButton` / `ClubDetailPage` (UI) - Case: join/leave toggles membership and patches the detail cache; Share copies the page URL and shows a self-dismissing "Link copied" confirmation; page loading/404/error/success branches - Status: Covered

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
