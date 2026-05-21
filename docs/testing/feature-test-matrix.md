# Feature Test Matrix

Last updated: 2026-05-20

## Lecture detail (`/lectures/:id`)
- Area: Live/video phase resolution, recording URL resolution, lecture detail UI states
- Status: Covered (server utils + service; join button client util)
- Test files: `src/server/learn/**/__tests__/*lecture*`, `src/components/features/learn/LearnPageDetails/lecture/live/utils/__tests__/*`
- Notes: See `docs/testing/features/lecture-detail.md`

## Learn hub (new-discussions)
- Area: Server + learn detail integration for entity-scoped discussions (non-admin)
- Status: Partial (unit coverage for helpers; integration tests for Drizzle list/create/reply not added yet)
- Test files: `src/server/new-discussions/**/__tests__/*.test.ts`
- Notes: UI lives under `src/components/features/new-discussions/`. Legacy `discussions` module and course discussion routes removed.

## Masaiverse
- Area: Server APIs (all endpoints)
- Status: Covered
- Test files: `src/server/masaiverse/__tests__/*.test.ts`
- Notes: Baseline unit tests exist for every exported API in `src/server/masaiverse/**`, split into modular files.

## Status Meaning

- `Covered`: key behavior and edge paths are fully tested for current scope.
- `Partial`: some major paths are covered, but important modules/cases are still pending.
- `Planned`: no meaningful automated test coverage yet.
