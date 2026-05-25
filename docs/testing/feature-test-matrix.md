# Feature Test Matrix

Last updated: 2026-05-25

## Lecture attendance (learn listing + detail)
- Area: `student_attendances` summaries on `GET /api/learn/batch-data` and `GET /api/learn/lectures/:id`; shared server utils + client UI state resolver
- Status: Covered (unit tests for catch-up + UI mapping)
- Test files: `src/server/attendance/**/__tests__/*`, `src/lib/lecture-attendance/**/__tests__/*`
- Notes: Optional (recommended) lectures omit `attendance` on both APIs

## Learn REST APIs (`/api/learn/*`)
- Area: HTTP routes for batches, batch-data, lecture/assignment/resource detail; client `learnApi.ts`; handlers + services split
- Status: Partial (handler + query parser tests; route integration tests pending)
- Test files: `src/server/api/learn/**/__tests__/*`
- Notes: See `docs/api-responses/learn/rest-endpoints.md`

## Resource detail (`/resources/:id`)
- Area: `GET /api/learn/resources/:id` + loader via `fetchResourceLearningDetailFromApi`; resource kind/phase/body/phase copy + discussions with threads on server
- Status: Covered (server utils + phase content + associated content drawer)
- Test files: `src/server/learn/utils/__tests__/normalizeResourceKind.test.ts`, `src/server/learn/utils/__tests__/buildResourceDetailPayload.test.ts`, `src/server/learn/utils/__tests__/buildLearnPhaseContent.test.ts`, `src/components/shared/markdown-content/__tests__/*`
- Notes: See `docs/testing/features/resource-detail.md`

## Assignment detail (`/assignments/:id`)
- Area: Single `getAssignmentLearningDetail` loader; assignment kind/phase/instructions/phase copy, server-driven sticky footer (status, score, CTAs), discussions with threads on server
- Status: Covered (server utils + footer builder + sticky footer UI; CTA click handlers / assess-platform APIs pending)
- Test files: `src/server/learn/utils/__tests__/resolveAssignmentPhase.test.ts`, `src/server/learn/utils/__tests__/calculateAssignmentProgressStatus.test.ts`, `src/server/learn/utils/__tests__/buildAssignmentDetailFooter.test.ts`, `src/server/learn/utils/__tests__/buildAssignmentDetailPayload.test.ts`, `src/components/features/learn/LearnPageDetails/assignment/shared/__tests__/AssignmentDetailStickyFooter.test.tsx`, `src/components/shared/markdown-content/__tests__/*`
- Notes: See `docs/testing/features/assignment-detail.md`

## Lecture detail (`/lectures/:id`)
- Area: Single `getLectureLearningDetail` loader (tabs, AI, associated, discussions+threads, video attendance, join button state); video save still POST-only
- Status: Covered (server utils + service; no initial client fetch for progress/intervals/discussion threads)
- Test files: `src/server/learn/**/__tests__/*lecture*`, `src/server/learn/utils/__tests__/resolveJoinLiveButtonState.test.ts`, `src/server/video-attendance/**/__tests__/*`, `src/components/features/learn/LearnPageDetails/lecture/video/hooks/__tests__/*`
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
