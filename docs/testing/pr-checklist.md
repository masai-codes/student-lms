# Test Documentation PR Checklist

Use this checklist in every PR that changes feature behavior, APIs, utilities, or test setup.

## Required

- [ ] Added or updated automated tests for behavior changed in this PR.
- [ ] Verified tests pass locally (`npm run test` or targeted command).
- [ ] Updated `docs/testing/feature-test-matrix.md` for touched feature(s).
- [ ] Updated feature file(s) under `docs/testing/features/` with:
  - [ ] new covered test cases
  - [ ] moved/removed test cases
  - [ ] pending gaps (if any)
- [ ] Confirmed commands in documentation still run as written.

## If Applicable

- [ ] Added new feature doc file in `docs/testing/features/<feature>.md`.
- [ ] Added new test case IDs in sequence (do not reuse IDs).
- [ ] Updated notes for known risk areas, edge cases, or intentional gaps.

## Reviewer Quick Check

- [ ] PR includes both code changes and matching test documentation updates.
- [ ] Coverage status (`Covered` / `Partial` / `Planned`) is accurate for changed feature(s).
