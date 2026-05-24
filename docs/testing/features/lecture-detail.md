# Lecture detail page

## Scope
- Route: `/lectures/$lectureId`
- Live lecture phases: before start, during live, after live (with / without recording)
- Video lecture phases: `before`, `during_after` (with / without recording)
- Server payload: `getLectureLearningDetail` → `LectureDetailPayload` (all tab bodies from DB; no static lecture copy)

## Test files
- `src/components/features/learn/LearnPageDetails/lecture/hooks/__tests__/lectureViewportLayout.test.ts` — first-viewport hero height reserves title, chat, and tab rows
- `src/components/features/learn/LearnPageDetails/lecture/hooks/__tests__/lectureChatDockLayout.test.ts` — inline chat docks only after scroll, not when below the fold
- `src/server/learn/utils/__tests__/parseLectureSettings.test.ts`
- `src/server/learn/utils/__tests__/resolveLectureVideoUrl.test.ts`
- `src/server/learn/utils/__tests__/resolveLiveLecturePhase.test.ts`
- `src/server/learn/utils/__tests__/resolveVideoLecturePhase.test.ts`
- `src/server/learn/utils/__tests__/scrubZoomLinkForSchedule.test.ts`
- `src/server/learn/utils/__tests__/buildLectureDetailPayload.test.ts`
- `src/server/learn/__tests__/getLectureLearningDetail.service.test.ts`
- `src/components/features/learn/LearnPageDetails/lecture/live/utils/__tests__/resolveJoinLiveButtonState.test.ts`

## Lecture discussions UI
- `LectureDiscussionsSection` — title + description composer, inline discussion list with expand/collapse replies
- `LectureDiscussionCreateForm`, `LectureDiscussionListItem`, `LectureDiscussionReplyForm`
- `src/server/new-discussions/services/checkIfValidQuery.ts` — LLM public/private on create
- `src/server/new-discussions/services/__tests__/checkIfValidQuery.test.ts`
- `src/server/new-discussions/services/__tests__/createDiscussionForLearnEntity.test.ts`

## Commands
- `npm run test -- src/server/learn`
- `npm run test -- src/components/features/learn/LearnPageDetails/lecture/live/utils`
