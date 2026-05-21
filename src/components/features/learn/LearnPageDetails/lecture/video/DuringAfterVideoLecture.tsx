'use client'

import { DuringAfterVideoLectureWithRecording } from './DuringAfterVideoLectureWithRecording'
import { DuringAfterVideoLectureWithoutRecording } from './DuringAfterVideoLectureWithoutRecording'

import type { LectureDetailPayload } from '@/server/learn/lectureDetailTypes'

type DuringAfterVideoLectureProps = {
  detail: LectureDetailPayload
}

export function DuringAfterVideoLecture({ detail }: DuringAfterVideoLectureProps) {
  if (detail.hasRecording && detail.videoUrl) {
    return (
      <DuringAfterVideoLectureWithRecording
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

  return <DuringAfterVideoLectureWithoutRecording />
}
