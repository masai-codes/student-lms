'use client'

import { LectureRecordingExperience } from '../LectureRecordingExperience'
import type { DiscussionListItem, LearningPriority } from '@/server/learn/types'
import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type {
  LectureDetailTabContent,
  LectureFeedbackState,
  LectureVideoAttendanceState,
} from '@/server/learn/lectureDetailTypes'

type DuringAfterVideoLectureWithRecordingProps = {
  videoUrl: string
  title: string
  tags: Array<string>
  priority: LearningPriority
  hostName: string
  hostAvatarUrl: string | null
  scheduleDisplayRange: string
  scheduleDisplayRangeIst?: string
  entityId: number
  discussions: Array<DiscussionListItem>
  hideNotes: boolean
  tabs: LectureDetailTabContent
  videoAttendance: LectureVideoAttendanceState | null
  attendance: LectureAttendanceSummary | null
  optionalAttendance?: LectureAttendanceSummary | null
  isBookmarked: boolean
  feedback: LectureFeedbackState
}

export function DuringAfterVideoLectureWithRecording(
  props: DuringAfterVideoLectureWithRecordingProps,
) {
  return <LectureRecordingExperience {...props} />
}
