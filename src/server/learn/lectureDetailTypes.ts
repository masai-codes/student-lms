import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type { LearnAssociatedListItem } from '@/server/learn/learnAssociatedTypes'
import type { LearnHubDetailPayload } from '@/server/learn/types'
import type { JoinLiveButtonState } from '@/server/learn/utils/resolveJoinLiveButtonState'
import type { WatchIntervalSegment } from '@/server/video-attendance/types'

export type LectureKind = 'live' | 'video'

export type LectureVideoAttendanceState = {
  lastWatchedPosition: number
  totalDuration: number | null
  watchPercentage: number
  mergedIntervals: Array<WatchIntervalSegment>
}

export type LiveLecturePhase = 'before' | 'during' | 'after'

export type VideoLecturePhase = 'before' | 'during_after'

export type LectureTranscriptSegment = {
  id: number
  start: number
  end: number
  text: string
}

export type LectureDetailTabContent = {
  description: string | null
  notes: string | null
  aiSummary: string | null
  /** Plain-text fallback (used when no segments are available). */
  transcript: string | null
  /** Structured transcript segments preferred for timestamp rendering. */
  transcriptSegments: Array<LectureTranscriptSegment>
  associatedItems: Array<LearnAssociatedListItem>
}

export type LectureDetailPayload = LearnHubDetailPayload & {
  lectureKind: LectureKind
  schedule: string | null
  concludes: string | null
  scheduleDisplayRange: string
  hostAvatarUrl: string | null
  hideVideo: boolean
  hideNotes: boolean
  notes: string | null
  tabs: LectureDetailTabContent
  videoUrl: string | null
  zoomLink: string | null
  livePhase: LiveLecturePhase | null
  videoPhase: VideoLecturePhase | null
  hasRecording: boolean
  joinLiveButtonState: JoinLiveButtonState | null
  videoAttendance: LectureVideoAttendanceState | null
  /** Null for recommended (optional) lectures. */
  attendance: LectureAttendanceSummary | null
}
