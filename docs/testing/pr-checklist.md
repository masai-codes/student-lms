# Test Documentation PR Checklist

Use this checklist in every PR that changes feature behavior, APIs, utilities, or test setup.

## Required

- [x] Added or updated automated tests for behavior changed in this PR.
- [x] Verified tests pass locally (`npm run test` or targeted command).
- [x] Updated `docs/testing/feature-test-matrix.md` for touched feature(s).
- [x] Updated feature file(s) under `docs/testing/features/` with:
  - [x] new covered test cases
  - [x] moved/removed test cases
  - [x] pending gaps (if any)
- [x] Confirmed commands in documentation still run as written.

## If Applicable

- [x] Added new feature doc file in `docs/testing/features/<feature>.md`.
- [x] Added new test case IDs in sequence (do not reuse IDs).
- [x] Updated notes for known risk areas, edge cases, or intentional gaps.

## Reviewer Quick Check

- [x] PR includes both code changes and matching test documentation updates.
- [x] Coverage status (`Covered` / `Partial` / `Planned`) is accurate for changed feature(s).

## Current PR: Server-driven lecture AI chat suggestions

- Feature doc: `docs/testing/features/lecture-detail.md` (`aiChatSuggestions` on
  lecture detail payload; empty-state chips via context).
- Matrix entry: "Lecture detail (`/lectures/:id`)", status `Covered` — notes the
  removed `GET /api/ai-tutor/lectures/:id/faqs` endpoint.
- Suite (targeted): builder + getLectureLearningDetail + LectureAiChatEmptyState
  - lectureFaqs + buildLectureDetailPayload → 30 passing; `npm run typecheck` clean.
- Intentional: FAQ shuffle is fixed for the page visit (baked into the
  route-loader payload); generic suggestion clicks still do not fire a dedicated
  GTM event (parity with prior web behaviour).
