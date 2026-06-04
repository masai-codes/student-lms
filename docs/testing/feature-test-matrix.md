# Feature Test Matrix

Last updated: 2026-06-04

## Sign-in (student UI)

- Area: Client sign-in flow (`src/components/features/sign-in/**`)
- Status: Covered (mock-only; no backend)
- Test files: `src/components/features/sign-in/*.test.ts`, `SignInFlow.test.tsx`
- Notes: Identifier parsing, reducer transitions, submit validation, and primary UI paths.

## Masaiverse
- Area: Server APIs (all endpoints)
- Status: Covered
- Test files: `src/server/masaiverse/__tests__/*.test.ts`
- Notes: Baseline unit tests exist for every exported API in `src/server/masaiverse/**`, split into modular files.

## Masaiverse v2 API
- Area: REST endpoints (`src/server/api/masaiverse-v2/**`)
- Status: Covered
- Test files: `src/server/api/masaiverse-v2/__tests__/*.test.ts`
- Notes: `markMasaiverseVisited` service + handler — success, unauthorized (401), and server-error (500) paths. Home (`GET /api/masaiverse-v2/home`) Section-1 stats: learners-in-community, discussions-this-week (posts + replies), events-this-year, registrations-this-year, plus the shared IST `dateRanges` helpers.

## Masaiverse v2 shell (sidebar + loading)
- Area: Section shell (`src/components/features/masaiverse-v2/MasaiverseV2LeftSection.tsx`, `MasaiverseLoader.tsx`)
- Status: Covered
- Test files: `src/components/features/masaiverse-v2/MasaiverseV2LeftSection.test.tsx`, `src/components/features/masaiverse-v2/MasaiverseLoader.test.tsx`
- Notes: Sidebar renders the Masai logo at the top alongside the heading and navigation. `MasaiverseLoader` renders the branded logo + sweeping bar in an `aria-busy` live region, with default/custom label and full-height vs compact layouts. The branded loader is wired as the `/masaiverse` route `pendingComponent`, and the access-check loader uses a 5-minute `staleTime` so in-section navigation no longer flashes a bare loader.

## Masaiverse v2 clubs (sidebar list + club detail)
- Area: Clubs (`src/server/api/masaiverse-v2/services/{getMyClubs,getClubDetail,setClubMembership}.service.ts`, `src/components/features/masaiverse-v2/{MyClubsSection,pages/ClubDetailPage,pages/club/*}.tsx`)
- Status: Covered
- Test files: `getMyClubs.service.test.ts`, `getClubDetail.service.test.ts`, `setClubMembership.service.test.ts`, `MyClubsSection.test.tsx`, `pages/ClubDetailPage.test.tsx`, `pages/club/{ClubDetailBanner,JoinClubButton,ShareClubButton}.test.tsx`
- Notes: Sidebar "My Clubs" is fetched live for the signed-in user (`GET /clubs/mine`). Club detail (`GET /clubs/detail`) returns the banner image/subtitle, `meta.clubDetailBannerTags`, live member count and join state; the banner renders the pill row `[first tag, member count, …rest]`, a Join/Joined toggle (`POST /clubs/membership`, idempotent join + cache patch), and a Share action that copies the page URL with a self-dismissing confirmation.

## Masaiverse v2 club stats section
- Area: Club stats (`src/server/api/masaiverse-v2/services/{getClubStats,recordClubVisit}.service.ts`, `src/components/features/masaiverse-v2/pages/club/{ClubStatsSection,clubStatsConfig}.*`)
- Status: Covered
- Test files: `getClubStats.service.test.ts`, `getClubStats.handler.test.ts`, `recordClubVisit.service.test.ts`, `recordClubVisit.handler.test.ts`, `pages/club/ClubStatsSection.test.tsx`, `pages/club/clubStatsConfig.test.ts`, `pages/ClubDetailPage.test.tsx`
- Notes: A four-card stats section on the club page (`GET /clubs/stats`): active members (`club_members.meta.lastVisitedAt` within 30 days), average event rating (`event_enrollments.meta.rating` across the club's events, 1dp), projects built (`clubs.meta.projectsBuild`), and community posts (club posts + their replies). Visiting the club page stamps `club_members.meta.lastVisitedAt` via `POST /clubs/visit` — only fired for members, a server-side no-op otherwise.

## Masaiverse v2 club & About sections
- Area: Club detail content (`getClubDetail` About/learning-tenure/gallery fields; `getClubEvents`/`getClubWeeklyConnects`/`eventScope`; club `AboutClubSection`, `LearningTenureSection`, `WeeklyConnectsSection`, `ClubUpcomingSection`, `ClubPastSection`, `ClubPhotosSection`, `ClubGalleryPage`; shared `EventsCarousel`/`HighlightsCarousel`)
- Status: Covered
- Test files: `getClubDetail.service.test.ts`, `eventScope.service.test.ts`, `getClubWeeklyConnects.service.test.ts`, `getClubEvents.service.test.ts`, `getClubEvents.handler.test.ts`, `pages/club/{AboutClubSection,LearningTenureSection,WeeklyConnectRow,WeeklyConnectsSection,ClubUpcomingSection,ClubPastSection,ClubPhotosSection}.test.tsx`, `pages/{ClubGalleryPage}.test.tsx`, `pages/home/{EventsCarousel,HighlightsCarousel}.test.tsx`, `masaiverseEventCard.test.ts`
- Notes: "About the Club" renders `clubs.meta.description` + `clubs.meta.aboutCardDetails` (`{heading,value}` rows). "Learning Tenure" renders `clubs.meta.learningTenureData` cards (emoji/heading/text/tag pills) with `meta.learningTenureDateText` shown to the right of the heading. "Club Photos" renders a mosaic from `clubs.meta.galleryImages` (1 big + up to 4 small, last tile overlays "+N more photos"); "View gallery" links to `/masaiverse/club/$clubId/gallery` (`ClubGalleryPage`), which lists every photo. All three are data-driven and hidden when their meta is empty. `GET /clubs/events` returns three sections: Weekly Connects (all `events.meta.isWeeklyConnect === true` for the club, client-sorted live→upcoming→completed), plus live/upcoming ("Live & Upcoming") and all past events ("Past Events") scoped to the club with weekly-connects excluded. The home "Live & Upcoming"/"Past Events" services and the `EventsCarousel`/`HighlightsCarousel` UI are reused by the club sections via an optional `MasaiverseEventScope` filter and props — no duplication. The home page passes `{ publicOnly: true }` so its events/highlights show only public events (`events.club_id IS NULL`); club events live on each club's page. The club page's "See schedule →" (Weekly Connects) and "View calendar →" (Live & Upcoming) CTAs open the right-side calendar `InlineDrawer`, mirroring the home page.

## Masaiverse v2 club discussions
- Area: Club-scoped discussions (`getCommunityDiscussions`/`createCommunityDiscussion` services + `listCommunityDiscussions`/`createCommunityDiscussion` handlers, `fetchMasaiverseV2Discussions`/`createMasaiverseV2Discussion` client + `masaiverseV2DiscussionsInfiniteQuery`, `pages/home/{CommunityDiscussionsSection,DiscussionComposer}.tsx`, `pages/club/ClubDiscussionsSection.tsx`)
- Status: Covered
- Test files: `getCommunityDiscussions.service.test.ts`, `createCommunityDiscussion.service.test.ts`, `createCommunityDiscussion.handler.test.ts`, `discussionInteractions.handler.test.ts`, `pages/home/{CommunityDiscussionsSection,DiscussionComposer}.test.tsx`, `pages/club/ClubDiscussionsSection.test.tsx`
- Notes: The same discussions stack powers both the home "Community Discussions" feed and the club page's "Club Discussion" section. Passing a `clubId` scopes the list to that club's posts (`club_id = clubId`) and ties new posts to it; omitting it keeps the club-less community feed (`club_id IS NULL`). The `clubId` threads through the query key, the list `GET` query param, and the create `POST` body. `CommunityDiscussionsSection` takes optional `clubId`/`title` props and hides the "View all" link when club-scoped; `ClubDiscussionsSection` is a thin wrapper that renders it as "Club Discussion" on `ClubDetailPage`.

## Masaiverse v2 leaderboard & points
- Area: Leaderboard scoring + club leaderboard (`src/server/api/masaiverse-v2/services/{leaderboardPoints,awardLeaderboardPoints.service,getClubLeaderboard.service}.ts`, `handlers/getClubLeaderboard.handler.ts`, `routes/api/masaiverse-v2/clubs/leaderboard.ts`, `components/features/masaiverse-v2/pages/club/{ClubLeaderboardSection,ClubLeaderboardRow,clubLeaderboardAvatar}.tsx`; points wired into `createCommunityDiscussion`/`createDiscussionReply`/`voteCommunityDiscussion` services)
- Status: Covered
- Test files: `leaderboardPoints.test.ts`, `awardLeaderboardPoints.service.test.ts`, `getClubLeaderboard.service.test.ts`, `getClubLeaderboard.handler.test.ts`, `createCommunityDiscussion.service.test.ts`, `discussionReplies.service.test.ts`, `voteCommunityDiscussion.service.test.ts`, `pages/club/{clubLeaderboardAvatar,ClubLeaderboardRow,ClubLeaderboardSection}.test.tsx`
- Notes: `LeaderboardReason` enum + `LEADERBOARD_POINTS` are the single source of scoring (post 10, reply given/received 5, upvotes 1). `awardLeaderboardPoints.service` centralises all writes to `masaiverse_leaderboard`: post creation awards the author; replies award `reply_given` + (non-self) `reply_received`; upvotes award `_given` + (non-self) `_received` and are revoked when the upvote is toggled off or switched to a downvote (downvotes never score). `club_id` is stored only when the post/event belongs to a club (community discussions stay null) and is inferred from the related post. `GET /clubs/leaderboard` ranks only current club members, sums only club-scoped points, and is paginated (`page`/`perPage`, default 5, max 50, `hasMore` via fetch-one-extra); each entry carries club-scoped posts ("projects") and event-enrollment counts. The `ClubLeaderboardSection` renders medals for the top 3, an initials/photo avatar, and Prev/Next paging (no full-board link), with loading/empty/error states.

## Masaiverse v2 event detail & registration
- Area: Event detail page (`src/server/api/masaiverse-v2/services/{getEventDetail,setEventEnrollment,rateEvent}.service.ts`, `handlers/{getEventDetail,setEventEnrollment,rateEvent}.handler.ts`, `routes/api/masaiverse-v2/events/{detail,enroll,rate}.ts`, `components/features/masaiverse-v2/pages/{EventDetailPage,event/*}.tsx`, `pages/home/EventCard.tsx`, `query/masaiverse-v2/eventsQuery.ts`)
- Status: Covered
- Test files: `getEventDetail.service.test.ts`, `setEventEnrollment.service.test.ts`, `rateEvent.service.test.ts`, `getEventDetail.handler.test.ts`, `setEventEnrollment.handler.test.ts`, `rateEvent.handler.test.ts`, `pages/event/{eventDetailFormat,EventHeroImage,EventInfoRows,EventRegisterCard,EventRatingCard}.test.tsx`, `pages/EventDetailPage.test.tsx`, `pages/home/EventCard.test.tsx`
- Notes: A Luma-style event detail/registration page at `/masaiverse/event/$eventId`. `GET /events/detail` returns the full event (title, description, `image_link`, category, mode, `event_link`, `location_title`/`location_map_link`, platform, start/end times, `meta.aboveTitle`/`belowTitle`/`isWeeklyConnect`, joined club name, derived live/upcoming/completed status, `isEnrolled`, live `enrolledCount`, plus the caller's own `userRating`/`userFeedback` read from `event_enrollments.meta`); a non-finite id or missing row yields 404. `POST /events/enroll` registers the user idempotently (`(user_id, event_id)` unique index) and returns the post-registration redirect — `event_link` for online events, `location_map_link` for offline — plus the refreshed count. `POST /events/rate` stores a 1–5 `rating` (+ optional trimmed `feedback`) into `event_enrollments.meta`; it validates the rating range, requires the event to have ended (`EVENT_NOT_ENDED`) and the caller to be enrolled (`NOT_ENROLLED`), and rejects a second submission (`ALREADY_RATED`). The page lays out the hero image beside the title/host/when-where rows and registration card, with the rich-text (markdown/HTML) description below; dates/times render in IST. `EventRegisterCard` registers in place (never auto-redirecting) and shows a celebratory confirmation; for already-registered users it offers an optional join/directions button. `EventRatingCard` appears only to a registered attendee of an ended event — an animated `StarRow` picker (hover spring + commit pop) plus optional feedback, submittable once, then flipping to a read-only thank-you state. `EventCard` links to the detail route, so the home "This Week" and club events carousels navigate into it, and shows a green "Registered" badge whenever the home events feed (which now carries the session user's `isEnrolled` per event) marks the event as one the user joined.

## Masaiverse v2 events listing page
- Area: Community events page (`src/server/api/masaiverse-v2/services/getEventsList.service.ts`, `services/eventScope.ts`, `handlers/getEventsList.handler.ts`, `routes/api/masaiverse-v2/events/list.ts`, `components/features/masaiverse-v2/pages/EventsPage.tsx`, `pages/events/{EventListCard,EventsToolbar,eventBuckets}.ts(x)`, `query/masaiverse-v2/eventsQuery.ts`)
- Status: Covered
- Test files: `getEventsList.service.test.ts`, `getEventsList.handler.test.ts`, `pages/events/{eventBuckets,EventListCard}.test.ts(x)`, `pages/EventsPage.test.tsx`
- Notes: `GET /events/list` returns every community event (public + club-hosted, weekly connects included — this is the one page that lists the whole calendar) with club name, category, mode, location, UTC ISO start/end times, and the session user's per-event `isEnrolled` flag (one batched enrollment lookup). `EventListCard` overlays a green "Registered" badge when `isEnrolled`. The page at `/masaiverse/events` segregates along two axes — time (Upcoming/Past tabs) and host (All/Community/Clubs chips) — with a title/club/venue search. Ordering: upcoming soonest-first (live events lead because they've already started), past most-recent-first; timeless/unparseable-timestamp events sink to the bucket's end. Tab counts reflect the active scope; scope-chip counts reflect the active tab. `EventListCard` shows a LIVE/TODAY/TOMORROW/time badge (or "Ended" for past), a Community vs club host badge, a category pill, IST date-time, and an online/venue line (venue placeholder when missing). Loading skeletons and tailored empty states per tab. Bucketing/scope/sort/search live in pure `eventBuckets` helpers; `now` is injectable into `EventsPage` for deterministic tests.

## Status Meaning

- `Covered`: key behavior and edge paths are fully tested for current scope.
- `Partial`: some major paths are covered, but important modules/cases are still pending.
- `Planned`: no meaningful automated test coverage yet.
