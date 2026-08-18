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

## Current PR: Profile page rebuild (`/profile`)

- Feature doc: `docs/testing/features/profile.md` (case IDs `PRF-001`–`PRF-031`, new sequence).
- Matrix entry: "Profile page (`/profile`)", status `Covered`.
- Suite: `npm run test` → 687 files / 3741 tests passing.
- `npm run lint`: no new problems in touched files (the repo's 495 pre-existing
  problems are untouched).
- `npm run check:contrast`: passes; its one warning
  (`foreground-subtle on background`, light theme) is pre-existing — `src/styles.css`
  was not modified.
- Intentional gaps, all recorded in the feature doc's Notes:
  - Seed flow `profile-page` authored but not executed (local `DATABASE_URL`
    points at a shared remote RDS).
  - Student Kit / My Invoices payloads depend on the external Admissions API and
    are covered with that client mocked.
  - Badge share links need `BADGE_SHARE_SECRET` (or `JWT_SECRET`), unset locally.
  - No coverage provider installed in the repo, so the 100% target is not
    machine-verified; every new module has a colocated test instead.
