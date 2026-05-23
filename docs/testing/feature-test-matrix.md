# Feature Test Matrix

Last updated: 2026-05-23

## Resource detail (`/resources/:id`)
- Area: Resource kind from category, phase resolution, reading body, type/phase UI routing (pre-read, notes, material × before, during, after)
- Status: Covered (server utils + phase copy; associated content / video not in scope yet)
- Test files: `src/server/learn/utils/__tests__/normalizeResourceKind.test.ts`, `src/server/learn/utils/__tests__/buildResourceDetailPayload.test.ts`, `src/components/features/learn/LearnPageDetails/resource/shared/__tests__/resourcePhaseCopy.test.ts`
- Notes: See `docs/testing/features/resource-detail.md`

## Assignment detail (`/assignments/:id`)
- Area: Assignment kind + phase resolution, detail payload, type/phase UI routing (practice, assignment, evaluation × before, during, after)
- Status: Covered (server utils + phase copy; problems/submissions UI not in scope yet)
- Test files: `src/server/learn/utils/__tests__/resolveAssignmentPhase.test.ts`, `src/server/learn/utils/__tests__/buildAssignmentDetailPayload.test.ts`, `src/components/features/learn/LearnPageDetails/assignment/shared/__tests__/assignmentPhaseCopy.test.ts`
- Notes: See `docs/testing/features/assignment-detail.md`

## Lecture detail (`/lectures/:id`)
- Area: Live/video phase resolution, recording URL resolution, lecture detail UI states, video player + attendance
- Status: Covered (server utils + service; join button client util; video attendance utils + API proxy)
- Test files: `src/server/learn/**/__tests__/*lecture*`, `src/components/features/learn/LearnPageDetails/lecture/live/utils/__tests__/*`, `src/lib/video-attendance/__tests__/*`, `src/server/video-attendance/**/__tests__/*`, `src/components/features/learn/LearnPageDetails/lecture/video/hooks/__tests__/*`
- Notes: See `docs/testing/features/lecture-detail.md`, `docs/testing/features/lecture-video-player.md`

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
