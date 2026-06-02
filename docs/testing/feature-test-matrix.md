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

## Status Meaning

- `Covered`: key behavior and edge paths are fully tested for current scope.
- `Partial`: some major paths are covered, but important modules/cases are still pending.
- `Planned`: no meaningful automated test coverage yet.
