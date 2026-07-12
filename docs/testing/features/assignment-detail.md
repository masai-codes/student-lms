# Assignment detail (`/assignments/:id`)

## Scope

- Server: assignment kind normalization (`practice` | `assignment` | `evaluation`), phase resolution (`before` | `during` | `after`), detail payload builder, progress status + sticky footer builder (submission, platform, settings), completed-details banner builder (auto-graded vs manual, timestamp clamped to `concludes`), header badges builder (deadline-enforced + evaluation weightage), live analytics builder (Assessment Platform progress, gated on launch), pledge modal (unlocked evaluation without a submission → a forced, non-dismissible integrity-acknowledgement overlay over the assignment content whose "Acknowledge & Confirm" creates the submission), problems list (non-deleted `assignment_problem` rows + per-problem `solutions.status`; footer hides when problems exist), access-controlled loader.
- Client: parent `AssignmentDetailPage` routes by kind; each kind content component routes by phase; layout (`LearnDetailOverview` + optional full-width not-started banner + associated-content CTA/drawer + `LearnDetailBodyGrid` with main left / discussions right + server-driven sticky footer). On mount `AssignmentDetailPage` also runs two legacy side-effects: `useAutoCreateAssignmentSubmission` (auto-starts a submission once the window is open for non-evaluation assignments with none yet) and `useTokenCompletion` (honours the Assess Platform `?sauToken=&markAsCompleted=true` return link).
- Auto-create submission (GAP #1 parity): fires only when not restricted, kind ≠ `evaluation`, phase ≠ `before`, and no submission exists; best-effort (409/403 swallowed); evaluations still gate creation behind the pledge.
- Token completion (GAP #3 parity): `POST /api/learn/assignments/:id/mark-completed-with-token` → `markSubmissionCompletedWithToken` validates the token against the token embedded in the submission's stored `assess_platform_link` (idempotent when already marked; 404/400/403 on missing submission/link/mismatch) and sets `mark_as_completed`.

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
| Pledge modal UI | `src/components/features/learn/LearnPageDetails/assignment/shared/__tests__/AssignmentPledgeModal.test.tsx` |
| Problems + solution-status queries | `src/server/learn/queries/__tests__/fetchAssignmentProblems.test.ts` |
| Problem list item builder | `src/server/learn/utils/__tests__/buildAssignmentProblemListItems.test.ts` |
| Problem list UI | `src/components/features/learn/LearnPageDetails/assignment/shared/__tests__/AssignmentProblemList.test.tsx` |
| Sticky footer UI | `src/components/features/learn/LearnPageDetails/assignment/shared/__tests__/AssignmentDetailStickyFooter.test.tsx` |
| Detail page kind routing + mount effects | `src/components/features/learn/LearnPageDetails/assignment/__tests__/AssignmentDetailPage.test.tsx` |
| Auto-create submission hook | `src/components/features/learn/LearnPageDetails/assignment/shared/__tests__/useAutoCreateAssignmentSubmission.test.tsx` |
| Token-completion hook | `src/components/features/learn/LearnPageDetails/assignment/shared/__tests__/useTokenCompletion.test.tsx` |
| Token-completion service | `src/server/assignments/services/__tests__/markSubmissionCompletedWithToken.test.ts` |
| Token-completion handler | `src/server/api/learn/handlers/__tests__/markSubmissionCompletedWithToken.handler.test.ts` |
| Token-completion client API | `src/lib/api/learn/__tests__/markSubmissionCompletedWithTokenApi.test.ts` |
| Not-started banner copy | `src/components/features/learn/LearnPageDetails/assignment/shared/__tests__/getAssignmentNotStartedBannerCopy.test.ts` |
| Not-started banner UI | `src/components/features/learn/LearnPageDetails/assignment/shared/__tests__/AssignmentNotStartedBanner.test.tsx` |
| Reusable full-width banner | `src/components/features/learn/LearnPageDetails/common/layout/__tests__/LearnDetailFullWidthBanner.test.tsx` |
| Markdown instructions rendering | `src/components/shared/markdown-content/__tests__/*` |
| Associated content list + href | `src/components/features/learn/LearnPageDetails/common/associated/__tests__/*` |
| Associated lecture id parsing | `src/server/learn/utils/__tests__/parseLectureDataJson.test.ts` |
| Associated dedupe | `src/server/learn/utils/__tests__/dedupeLearnAssociatedItems.test.ts` |

## Commands

```bash
npm run test -- src/server/learn/utils/__tests__/resolveAssignmentPhase.test.ts src/server/learn/utils/__tests__/calculateAssignmentProgressStatus.test.ts src/server/learn/utils/__tests__/buildAssignmentDetailFooter.test.ts src/server/learn/utils/__tests__/buildAssignmentDetailPayload.test.ts src/components/features/learn/LearnPageDetails/assignment/__tests__ src/components/features/learn/LearnPageDetails/assignment/shared/__tests__ src/server/assignments/services/__tests__/markSubmissionCompletedWithToken.test.ts src/server/api/learn/handlers/__tests__/markSubmissionCompletedWithToken.handler.test.ts src/lib/api/learn/__tests__/markSubmissionCompletedWithTokenApi.test.ts src/components/features/learn/LearnPageDetails/common/layout/__tests__/LearnDetailFullWidthBanner.test.tsx src/components/shared/markdown-content/__tests__
npm run typecheck
```

## Manual checks

- Open assignments of each type before schedule, during window, and after concludes.
- Confirm hero state, header meta, not-started banner (full width above main/discussions) when before schedule, instructions block, discussions panel, and sticky footer (status chip, score notice, start/continue/practice CTAs) for problem-less assessment assignments.
- Confirm the completed-details banner appears in the main body once a submission is completed (auto-graded wording) or manually marked complete (`data.marked_completed_at` wording), and the displayed time never exceeds the deadline.
- Confirm header badges (Deadline Enforced, weightage on evaluations) render in the meta row, and the Assessment Platform live-analytics widget renders with a working Refetch once the test is launched.
- Confirm an unlocked evaluation with no submission shows the pledge modal over the assignment content; the modal cannot be dismissed (no close button / escape / outside-click), and accepting + confirming creates the submission and reveals the normal evaluation content.
- Confirm assignments with problems render the Problems list (each card showing the per-problem solution status), hide the sticky footer, and link to the problem detail page (see `problem-detail.md`).
- Confirm opening a non-evaluation assignment after its schedule opens auto-creates a submission (status flips to In Progress without clicking Start); evaluations do not auto-create (pledge required first).
- Confirm returning from the Assess Platform to `/assignments/:id?sauToken=<token>&markAsCompleted=true` marks the assignment complete; a wrong/blank token leaves it unchanged.
