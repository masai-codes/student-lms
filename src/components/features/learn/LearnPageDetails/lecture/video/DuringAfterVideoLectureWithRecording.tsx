'use client'

import { LectureRecordingExperience } from '../LectureRecordingExperience'
import type { DiscussionListItem } from '@/server/learn/types'

type DuringAfterVideoLectureWithRecordingProps = {
  videoUrl: string
  title: string
  hostName: string
  hostAvatarUrl: string | null
  scheduleDisplayRange: string
  entityId: number
  discussions: Array<DiscussionListItem>
}

export function DuringAfterVideoLectureWithRecording(
  props: DuringAfterVideoLectureWithRecordingProps,
) {
  return <LectureRecordingExperience {...props} />
}
