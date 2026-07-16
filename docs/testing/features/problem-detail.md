# Problem detail (`/assignments/:assignmentId/problems/:problemId`)

## Scope

- Server: single `GET /api/learn/assignments/:assignmentId/problems/:problemId` →
  handler → `getAssignmentProblemDetailForUser` service. Access-controlled (the
  user's batch/section), returns the problem (statement + `LINK`/`FILE`/`BUTTON`
  type), the assignment title, and the user's solution (link + submitted-at), plus
  derived `acceptsSubmission` / `canSubmit` flags.
- Submission actions (REST):
  - `PATCH /api/learn/solutions/:solutionId` — submit a LINK solution (validated http(s) URL).
  - `POST /api/learn/solutions/:solutionId/file` — upload a file (reuses `uploadImageToS3`) and submit.
  - Shared `submitSolutionForUser` service verifies the user owns the solution, then sets
    `submission_link` + `status='submitted'` + `submitted_at`.
- Client: `/assignments/:aId/problems/:pId` route → `ProblemDetailPage` (header,
  markdown statement, submitted summary, and the per-type `ProblemSolutionForm`).
  The assignment Problems list links each card here. BUTTON problems render
  instructions only (no submission); `type === null` does not exist in the schema.

## Test files

| Area                           | File                                                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Problem + solution queries     | `src/server/learn/queries/__tests__/fetchProblemDetail.test.ts`                                             |
| Problem detail payload builder | `src/server/learn/utils/__tests__/buildProblemDetailPayload.test.ts`                                        |
| GET handler                    | `src/server/api/learn/handlers/__tests__/getProblemDetail.handler.test.ts`                                  |
| Submit-solution service        | `src/server/assignments/services/__tests__/submitSolution.service.test.ts`                                  |
| Submit/upload handlers         | `src/server/api/learn/handlers/__tests__/solutionSubmissionActions.handler.test.ts`                         |
| URL validation                 | `src/lib/learn/isValidSubmissionUrl.test.ts`                                                                |
| Solution form UI               | `src/components/features/learn/LearnPageDetails/problem/__tests__/ProblemSolutionForm.test.tsx`             |
| Page UI                        | `src/components/features/learn/LearnPageDetails/problem/__tests__/ProblemDetailPage.test.tsx`               |
| Problems list link-out         | `src/components/features/learn/LearnPageDetails/assignment/shared/__tests__/AssignmentProblemList.test.tsx` |

## Commands

```bash
npm run test -- src/server/learn/queries/__tests__/fetchProblemDetail.test.ts src/server/learn/utils/__tests__/buildProblemDetailPayload.test.ts src/server/api/learn/handlers/__tests__/getProblemDetail.handler.test.ts src/server/assignments/services/__tests__/submitSolution.service.test.ts src/server/api/learn/handlers/__tests__/solutionSubmissionActions.handler.test.ts src/lib/learn/isValidSubmissionUrl.test.ts src/components/features/learn/LearnPageDetails/problem
npm run typecheck
```

## Manual checks

- Open a LINK problem: paste an invalid URL (inline error, no request), then a valid one (submits, page refreshes, shows "Submitted link on …").
- Open a FILE problem: choose a file, submit, confirm it uploads and shows "Submitted file".
- Open a BUTTON problem: only instructions render, no submission control.
- Re-open a submitted problem: the form is hidden unless `settings.is_multiple_submissions_allowed` is set.
- Deep-link a problem from another batch / a problem not linked to the assignment → 404.
