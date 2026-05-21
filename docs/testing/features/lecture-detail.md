# Lecture detail page

## Scope
- Route: `/lectures/$lectureId`
- Live lecture phases: before start, during live, after live (with / without recording)
- Video lecture phases: `before`, `during_after` (with / without recording)
- Server payload: `getLectureLearningDetail` → `LectureDetailPayload`

## Test files
- `src/server/learn/utils/__tests__/parseLectureSettings.test.ts`
- `src/server/learn/utils/__tests__/resolveLectureVideoUrl.test.ts`
- `src/server/learn/utils/__tests__/resolveLiveLecturePhase.test.ts`
- `src/server/learn/utils/__tests__/resolveVideoLecturePhase.test.ts`
- `src/server/learn/utils/__tests__/scrubZoomLinkForSchedule.test.ts`
- `src/server/learn/utils/__tests__/buildLectureDetailPayload.test.ts`
- `src/server/learn/__tests__/getLectureLearningDetail.service.test.ts`
- `src/components/features/learn/LearnPageDetails/lecture/live/utils/__tests__/resolveJoinLiveButtonState.test.ts`

## Commands
- `npm run test -- src/server/learn`
- `npm run test -- src/components/features/learn/LearnPageDetails/lecture/live/utils`
