'use client'

import { LectureRecordingExperience } from '../LectureRecordingExperience'
import type { DiscussionListItem, LearningPriority } from '@/server/learn/types'
import type { LectureDetailTabContent } from '@/server/learn/lectureDetailTypes'

type AfterLiveLectureWithRecordingProps = {
  videoUrl: string
  title: string
  tags: Array<string>
  priority: LearningPriority
  hostName: string
  hostAvatarUrl: string | null
  scheduleDisplayRange: string
  entityId: number
  discussions: Array<DiscussionListItem>
  hideNotes: boolean
  tabs: LectureDetailTabContent
}

export function AfterLiveLectureWithRecording(props: AfterLiveLectureWithRecordingProps) {
  return <LectureRecordingExperience {...props} />
}
