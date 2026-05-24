# Assignment detail (`/assignments/:id`)

## Scope

- Server: assignment kind normalization (`practice` | `assignment` | `evaluation`), phase resolution (`before` | `during` | `after`), detail payload builder, access-controlled loader.
- Client: parent `AssignmentDetailPage` routes by kind; each kind content component routes by phase; original layout (`LearnDetailOverview` + `LearnDetailBodyGrid` with main left / discussions right).

## Test files

| Area | File |
|------|------|
| Phase resolution | `src/server/learn/utils/__tests__/resolveAssignmentPhase.test.ts` |
| Payload builder | `src/server/learn/utils/__tests__/buildAssignmentDetailPayload.test.ts` |
| Phase copy | `src/components/features/learn/LearnPageDetails/assignment/shared/__tests__/assignmentPhaseCopy.test.ts` |
| Markdown instructions rendering | `src/components/shared/markdown-content/__tests__/*` |

## Commands

```bash
npm run test -- src/server/learn/utils/__tests__/resolveAssignmentPhase.test.ts src/server/learn/utils/__tests__/buildAssignmentDetailPayload.test.ts src/components/features/learn/LearnPageDetails/assignment/shared/__tests__/assignmentPhaseCopy.test.ts src/components/shared/markdown-content/__tests__
npm run typecheck
```

## Manual checks

- Open assignments of each type before schedule, during window, and after concludes.
- Confirm hero state, header meta, instructions block, and discussions panel render (inline create form, expandable replies — same as lecture detail).
