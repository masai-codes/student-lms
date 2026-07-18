'use client'

import { AfterLiveLectureWithAdaptiveRecording } from './AfterLiveLectureWithAdaptiveRecording'
import { AfterLiveLectureWithRecording } from './AfterLiveLectureWithRecording'
import { AfterLiveLectureWithoutRecording } from './AfterLiveLectureWithoutRecording'

import type { LectureDetailPayload } from '@/server/learn/lectureDetailTypes'

type AfterLiveLectureProps = {
  detail: LectureDetailPayload
}

export function AfterLiveLecture({ detail }: AfterLiveLectureProps) {
  if (detail.hasRecording && detail.videoUrl) {
    return (
      <AfterLiveLectureWithRecording
        videoUrl={detail.videoUrl}
        title={detail.title}
        tags={detail.tags}
        priority={detail.priority}
        hostName={detail.hostName}
        hostAvatarUrl={detail.hostAvatarUrl}
        scheduleDisplayRange={detail.scheduleDisplayRange}
        scheduleDisplayRangeIst={detail.scheduleDisplayRangeIst}
        entityId={detail.id}
        discussions={detail.discussions}
        hideNotes={detail.hideNotes}
        tabs={detail.tabs}
        videoAttendance={detail.videoAttendance}
        attendance={detail.attendance}
        optionalAttendance={detail.optionalAttendance}
        isLiveLecture={detail.lectureKind === 'live'}
        isBookmarked={detail.isBookmarked}
        feedback={detail.feedback}
        inLecturePopupQuiz={detail.inLecturePopupQuiz}
      />
    )
  }

  // SAL (adaptive) lectures store their recording on the adaptive platform, not
  // in `videoUrl`; the lecture-scoped link redirects there once the meeting ends.
  if (detail.adaptiveRecordingUrl) {
    return (
      <AfterLiveLectureWithAdaptiveRecording
        lectureId={detail.id}
        recordingUrl={detail.adaptiveRecordingUrl}
      />
    )
  }

  return <AfterLiveLectureWithoutRecording />
}
