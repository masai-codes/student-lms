# Feature Test Matrix

Last updated: 2026-05-11

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

## Status Meaning

- `Covered`: key behavior and edge paths are fully tested for current scope.
- `Partial`: some major paths are covered, but important modules/cases are still pending.
- `Planned`: no meaningful automated test coverage yet.
