# Assignment detail (`/assignments/:id`)

## Scope

- Server: assignment kind normalization (`practice` | `assignment` | `evaluation`), phase resolution (`before` | `during` | `after`), detail payload builder, progress status + sticky footer builder (submission, platform, settings), access-controlled loader.
- Client: parent `AssignmentDetailPage` routes by kind; each kind content component routes by phase; layout (`LearnDetailOverview` + optional full-width not-started banner + `LearnDetailBodyGrid` with main left / discussions right + server-driven sticky footer).

## Test files

| Area | File |
|------|------|
| Phase resolution | `src/server/learn/utils/__tests__/resolveAssignmentPhase.test.ts` |
| Progress status | `src/server/learn/utils/__tests__/calculateAssignmentProgressStatus.test.ts` |
| Sticky footer builder | `src/server/learn/utils/__tests__/buildAssignmentDetailFooter.test.ts` |
| Payload builder | `src/server/learn/utils/__tests__/buildAssignmentDetailPayload.test.ts` |
| Sticky footer UI | `src/components/features/learn/LearnPageDetails/assignment/shared/__tests__/AssignmentDetailStickyFooter.test.tsx` |
| Not-started banner copy | `src/components/features/learn/LearnPageDetails/assignment/shared/__tests__/getAssignmentNotStartedBannerCopy.test.ts` |
| Not-started banner UI | `src/components/features/learn/LearnPageDetails/assignment/shared/__tests__/AssignmentNotStartedBanner.test.tsx` |
| Reusable full-width banner | `src/components/features/learn/LearnPageDetails/common/layout/__tests__/LearnDetailFullWidthBanner.test.tsx` |
| Markdown instructions rendering | `src/components/shared/markdown-content/__tests__/*` |

## Commands

```bash
npm run test -- src/server/learn/utils/__tests__/resolveAssignmentPhase.test.ts src/server/learn/utils/__tests__/calculateAssignmentProgressStatus.test.ts src/server/learn/utils/__tests__/buildAssignmentDetailFooter.test.ts src/server/learn/utils/__tests__/buildAssignmentDetailPayload.test.ts src/components/features/learn/LearnPageDetails/assignment/shared/__tests__ src/components/features/learn/LearnPageDetails/common/layout/__tests__/LearnDetailFullWidthBanner.test.tsx src/components/shared/markdown-content/__tests__
npm run typecheck
```

## Manual checks

- Open assignments of each type before schedule, during window, and after concludes.
- Confirm hero state, header meta, not-started banner (full width above main/discussions) when before schedule, instructions block, discussions panel, and sticky footer (status chip, score notice, start/continue/practice CTAs) for problem-less assessment assignments.
