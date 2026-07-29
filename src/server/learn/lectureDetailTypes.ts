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

/**
 * Where to fetch a lecture's transcript, instead of the transcript itself.
 *
 * Transcripts for long lectures run into megabytes, and shipping them inside the
 * lecture-detail payload made the whole page wait on them (#353). The payload now
 * carries only this descriptor: `available` is enough to decide whether the CC
 * button and the Transcript tab have anything to offer, and `url` is fetched
 * lazily — when captions are switched on, or when the Transcript tab is opened.
 */
export type LectureTranscriptSource = {
  /** True when `lectures_ai` holds a non-empty transcript or segment list. */
  available: boolean
  /**
   * Cookie-free, CloudFront-cacheable path (`/api/cache/...`). Null when there is
   * no transcript, or when the lecture isn't scoped to a batch + section (the
   * cache path is keyed on both so a batch or section can be invalidated by prefix).
   */
  url: string | null
}

/** Response body of the cacheable transcript endpoint. */
export type LectureTranscriptPayload = {
  lectureId: number
  segments: Array<LectureTranscriptSegment>
  /** Plain-text fallback, used when no structured segments exist. */
  text: string | null
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
  /**
   * Pointer to the transcript, never the transcript text — see
   * `LectureTranscriptSource`. Fetched on demand by `useLectureTranscript`.
   */
  transcript: LectureTranscriptSource
  associatedItems: Array<LearningItem>
}

export type LectureDetailPayload = LearnHubDetailPayload & {
  lectureKind: LectureKind
  schedule: string | null
  concludes: string | null
  scheduleDisplayRange: string
  /** Same range forced to IST, populated client-side for the non-IST hover tooltip. */
  scheduleDisplayRangeIst?: string
  hostAvatarUrl: string | null
  hideVideo: boolean
  hideNotes: boolean
  notes: string | null
  tabs: LectureDetailTabContent
  videoUrl: string | null
  zoomLink: string | null
  /**
   * For a SAL (adaptive) live lecture that has ended, the lecture-scoped
   * adaptive join link — which the experience-api handler redirects to the
   * recording once the meeting is over. Null for non-adaptive lectures, or
   * before the lecture ends. Powers the "Watch Recording" affordance since SAL
   * recordings live on the adaptive platform, not in `videoUrl`.
   */
  adaptiveRecordingUrl: string | null
  livePhase: LiveLecturePhase | null
  videoPhase: VideoLecturePhase | null
  hasRecording: boolean
  joinLiveButtonState: JoinLiveButtonState | null
  videoAttendance: LectureVideoAttendanceState | null
  /** Null for recommended (optional) lectures. */
  attendance: LectureAttendanceSummary | null
  /**
   * Only populated for recommended (optional) lectures; null otherwise. Powers
   * the info tooltip next to the title, since optional lectures don't show the
   * regular attendance badge.
   */
  optionalAttendance: LectureAttendanceSummary | null
  /** Whether the current user has bookmarked this lecture. */
  isBookmarked: boolean
  /** When true, live join uses the ZEF redirect flow instead of the raw zoom link. */
  isNewZoomRedirection: boolean
  /**
   * `sections.settings.enableZoomWebView`. When true (and the lecture is a
   * non-adaptive, non-ZEF Zoom link), the live-join CTA opens the old LMS's
   * embedded Zoom Web SDK page (`/lectures/:id/zoom`) instead of the raw link.
   */
  enableZoomWebView: boolean
  /** Lecture feedback window + the user's existing rating/text. */
  feedback: LectureFeedbackState
}
