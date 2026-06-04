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
- Notes: "About the Club" renders `clubs.meta.description` + `clubs.meta.aboutCardDetails` (`{heading,value}` rows). "Learning Tenure" renders `clubs.meta.learningTenureData` cards (emoji/heading/text/tag pills) with `meta.learningTenureDateText` shown to the right of the heading. "Club Photos" renders a mosaic from `clubs.meta.galleryImages` (1 big + up to 4 small, last tile overlays "+N more photos"); "View gallery" links to `/masaiverse/club/$clubId/gallery` (`ClubGalleryPage`), which lists every photo. All three are data-driven and hidden when their meta is empty. `GET /clubs/events` returns three sections: Weekly Connects (all `events.meta.isWeeklyConnect === true` for the club, client-sorted live→upcoming→completed), plus live/upcoming ("Upcoming & Live") and last-week past events ("Club Events from Last Week") scoped to the club with weekly-connects excluded. The home "This Week"/"Highlights" services and the `EventsCarousel`/`HighlightsCarousel` UI are reused by the club sections via an optional `MasaiverseEventScope` filter and props — no duplication. The home page passes `{ publicOnly: true }` so its events/highlights show only public events (`events.club_id IS NULL`); club events live on each club's page. The club page's "See schedule →" (Weekly Connects) and "View calendar →" (Upcoming & Live) CTAs open the right-side calendar `InlineDrawer`, mirroring the home page.

## Status Meaning

- `Covered`: key behavior and edge paths are fully tested for current scope.
- `Partial`: some major paths are covered, but important modules/cases are still pending.
- `Planned`: no meaningful automated test coverage yet.
