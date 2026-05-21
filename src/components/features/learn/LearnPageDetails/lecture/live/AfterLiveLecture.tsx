'use client'

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
        hostName={detail.hostName}
        hostAvatarUrl={detail.hostAvatarUrl}
        scheduleDisplayRange={detail.scheduleDisplayRange}
        entityId={detail.id}
        discussions={detail.discussions}
      />
    )
  }

  return <AfterLiveLectureWithoutRecording />
}
