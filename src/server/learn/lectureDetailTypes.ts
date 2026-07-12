import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type { LearnHubDetailPayload, LearningItem } from '@/server/learn/types'
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

export type LectureFeedbackState = {
  /** Whether the feedback form is open for submission (show_feedback + within window). */
  canSubmit: boolean
  /** Existing rating 1–5, or null when not yet submitted. */
  rating: number | null
  /** Existing free-text feedback, or null. */
  text: string | null
}

export type LectureDetailTabContent = {
  /** Rendered under the single "Description" tab (legacy LMS used `lectures.notes`). */
  notes: string | null
  aiSummary: string | null
  /** Plain-text fallback (used when no segments are available). */
  transcript: string | null
  /** Structured transcript segments preferred for timestamp rendering. */
  transcriptSegments: Array<LectureTranscriptSegment>
  associatedItems: Array<LearningItem>
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
  /** Whether the current user has bookmarked this lecture. */
  isBookmarked: boolean
  /** When true, live join uses the ZEF redirect flow instead of the raw zoom link. */
  isNewZoomRedirection: boolean
  /** Lecture feedback window + the user's existing rating/text. */
  feedback: LectureFeedbackState
}
