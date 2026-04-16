# Testing Coverage Hub

This folder tracks test coverage by feature so anyone can quickly answer:
- what is tested
- what is pending
- how to run tests
- what to update when implementation changes

## Folder Structure

- `docs/testing/README.md` - overview and workflow
- `docs/testing/feature-test-matrix.md` - single source of truth for feature-level coverage status
- `docs/testing/pr-checklist.md` - required checklist for PR test-doc updates
- `docs/testing/features/*.md` - detailed cases per feature

## How To Run Tests

- Run all tests:
  - `npm run test`
- Run one feature file:
  - `npm run test -- src/server/masaiverse/masaiverse.server.test.ts`
- Run tests in watch mode (local dev):
  - `npx vitest`

## Required Update Workflow

Update this folder in the same PR whenever:
- production behavior changes
- tests are added/removed/renamed
- test execution commands or setup change

For every feature touched:
1. update `feature-test-matrix.md`
2. update or create `docs/testing/features/<feature>.md`
3. ensure commands in docs are still valid
4. complete `docs/testing/pr-checklist.md`

## Conventions

- Keep test case IDs stable (for example, `MASAIVE-API-001`)
- Use one line per test case with clear status
- Mark status as one of:
  - `Covered`
  - `Partial`
  - `Planned`
- Add short notes for known gaps or edge cases
