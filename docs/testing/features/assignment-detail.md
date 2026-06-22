# Assignment detail (`/assignments/:id`)

## Scope

- Server: assignment kind normalization (`practice` | `assignment` | `evaluation`), phase resolution (`before` | `during` | `after`), detail payload builder, progress status + sticky footer builder (submission, platform, settings), completed-details banner builder (auto-graded vs manual, timestamp clamped to `concludes`), header badges builder (deadline-enforced + evaluation weightage), live analytics builder (Assessment Platform progress, gated on launch), pledge gate (unlocked evaluation without a submission → integrity acknowledgement that creates the submission), problems list (non-deleted `assignment_problem` rows + per-problem `solutions.status`; footer hides when problems exist), access-controlled loader.
- Client: parent `AssignmentDetailPage` routes by kind; each kind content component routes by phase; layout (`LearnDetailOverview` + optional full-width not-started banner + associated-content CTA/drawer + `LearnDetailBodyGrid` with main left / discussions right + server-driven sticky footer).

## Test files

| Area | File |
|------|------|
| Phase resolution | `src/server/learn/utils/__tests__/resolveAssignmentPhase.test.ts` |
| Progress status | `src/server/learn/utils/__tests__/calculateAssignmentProgressStatus.test.ts` |
| Sticky footer builder | `src/server/learn/utils/__tests__/buildAssignmentDetailFooter.test.ts` |
| Payload builder | `src/server/learn/utils/__tests__/buildAssignmentDetailPayload.test.ts` |
| Completed-details builder | `src/server/learn/utils/__tests__/buildAssignmentCompletedDetails.test.ts` |
| Completed-details banner UI | `src/components/features/learn/LearnPageDetails/assignment/shared/__tests__/AssignmentCompletedBanner.test.tsx` |
| Header badges builder | `src/server/learn/utils/__tests__/buildAssignmentHeaderBadges.test.ts` |
| Header badges UI | `src/components/features/learn/LearnPageDetails/assignment/shared/__tests__/AssignmentHeaderBadges.test.tsx` |
| Live analytics builder | `src/server/learn/utils/__tests__/buildAssignmentLiveAnalytics.test.ts` |
| Live analytics UI | `src/components/features/learn/LearnPageDetails/assignment/shared/__tests__/AssignmentLiveAnalytics.test.tsx` |
| Pledge requirement resolver | `src/server/learn/utils/__tests__/resolveAssignmentRequiresPledge.test.ts` |
| Pledge gate UI | `src/components/features/learn/LearnPageDetails/assignment/shared/__tests__/AssignmentPledgeGate.test.tsx` |
| Problems + solution-status queries | `src/server/learn/queries/__tests__/fetchAssignmentProblems.test.ts` |
| Problem list item builder | `src/server/learn/utils/__tests__/buildAssignmentProblemListItems.test.ts` |
| Problem list UI | `src/components/features/learn/LearnPageDetails/assignment/shared/__tests__/AssignmentProblemList.test.tsx` |
| Sticky footer UI | `src/components/features/learn/LearnPageDetails/assignment/shared/__tests__/AssignmentDetailStickyFooter.test.tsx` |
| Not-started banner copy | `src/components/features/learn/LearnPageDetails/assignment/shared/__tests__/getAssignmentNotStartedBannerCopy.test.ts` |
| Not-started banner UI | `src/components/features/learn/LearnPageDetails/assignment/shared/__tests__/AssignmentNotStartedBanner.test.tsx` |
| Reusable full-width banner | `src/components/features/learn/LearnPageDetails/common/layout/__tests__/LearnDetailFullWidthBanner.test.tsx` |
| Markdown instructions rendering | `src/components/shared/markdown-content/__tests__/*` |
| Associated content list + href | `src/components/features/learn/LearnPageDetails/common/associated/__tests__/*` |
| Associated lecture id parsing | `src/server/learn/utils/__tests__/parseLectureDataJson.test.ts` |
| Associated dedupe | `src/server/learn/utils/__tests__/dedupeLearnAssociatedItems.test.ts` |

## Commands

```bash
npm run test -- src/server/learn/utils/__tests__/resolveAssignmentPhase.test.ts src/server/learn/utils/__tests__/calculateAssignmentProgressStatus.test.ts src/server/learn/utils/__tests__/buildAssignmentDetailFooter.test.ts src/server/learn/utils/__tests__/buildAssignmentDetailPayload.test.ts src/components/features/learn/LearnPageDetails/assignment/shared/__tests__ src/components/features/learn/LearnPageDetails/common/layout/__tests__/LearnDetailFullWidthBanner.test.tsx src/components/shared/markdown-content/__tests__
npm run typecheck
```

## Manual checks

- Open assignments of each type before schedule, during window, and after concludes.
- Confirm hero state, header meta, not-started banner (full width above main/discussions) when before schedule, instructions block, discussions panel, and sticky footer (status chip, score notice, start/continue/practice CTAs) for problem-less assessment assignments.
- Confirm the completed-details banner appears in the main body once a submission is completed (auto-graded wording) or manually marked complete (`data.marked_completed_at` wording), and the displayed time never exceeds the deadline.
- Confirm header badges (Deadline Enforced, weightage on evaluations) render in the meta row, and the Assessment Platform live-analytics widget renders with a working Refetch once the test is launched.
- Confirm an unlocked evaluation with no submission shows the pledge gate; accepting + confirming creates the submission and reveals the normal evaluation content.
- Confirm assignments with problems render the Problems list (each card showing the per-problem solution status) and hide the sticky footer. (Problem detail navigation is a deferred follow-up.)
