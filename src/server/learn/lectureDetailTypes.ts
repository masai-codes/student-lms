import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type { LearnHubDetailPayload, LearningItem } from '@/server/learn/types'
import type { JoinLiveButtonState } from '@/server/learn/utils/resolveJoinLiveButtonState'
import type { InLecturePopupQuiz } from '@/server/learn/utils/parseLectureSettings'
import type { WatchIntervalSegment } from '@/server/video-attendance/types'

export type { InLecturePopupQuiz }

/**
 * A single in-lecture popup quiz element, sourced from `zef_lms_quiz`.
 * `startSec` / `endSec` are the video-relative show window in whole seconds,
 * already derived from the element's absolute timestamps minus the parent
 * meta row's `scheduledAt` (video t=0) — see getInLecturePopupElements.service.
 */
export type InLecturePopupQuizElement = {
  id: number
  assessmentId: string
  status: 'active' | 'inactive'
  startSec: number
  endSec: number
}

/** A single in-lecture popup poll question, sourced from `zef_lms_polls_questions`. */
export type InLecturePopupPollElement = {
  id: number
  question: string
  options: unknown
  status: 'active' | 'inactive'
  startSec: number
  endSec: number
}

/**
 * The lecture's `zef_lms_meta_data` row — the parent of its quiz/poll elements.
 * `scheduledAt` is the reference point for converting the elements' absolute
 * `startTimestamp` / `endTimestamp` into the video-relative show window.
 */
export type InLecturePopupMetaData = {
  id: number
  lectureId: number
  scheduledAt: string | null
  source: 'zef' | 'lms'
  createdAt: string | null
  updatedAt: string | null
}

/**
 * In-lecture popup elements for a lecture, keyed by kind. `metaData` is `null`
 * and both arrays empty when the lecture has no `zef_lms_meta_data` row (i.e.
 * nothing configured).
 */
export type InLecturePopupElements = {
  metaData: InLecturePopupMetaData | null
  quiz: Array<InLecturePopupQuizElement>
  polls: Array<InLecturePopupPollElement>
}

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
  /**
   * `'zef'` when the lecture has a `zef_lms_meta_data` row — tagged feedback,
   * always open, saved to `zef_lms_feedback_submissions`. `'legacy'`
   * otherwise — the original rating+text flow, window-gated, no tags, saved
   * to `lecture_feedback`.
   */
  mode: 'zef' | 'legacy'
  /** Whether the feedback form is open for submission. Always true in `zef` mode. */
  canSubmit: boolean
  /** Existing rating 1–5, or null when not yet submitted. */
  rating: number | null
  /** Existing free-text feedback, or null. */
  text: string | null
  /** Existing follow-up tags chosen alongside the rating. Always empty in `legacy` mode. */
  tags: Array<string>
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
  /**
   * In-lecture popup elements (quizzes + polls) to surface while the recording
   * plays, sourced from the ZEF ⇆ LMS tables (`zef_lms_meta_data` → `zef_lms_quiz`
   * / `zef_lms_polls_questions`). Both arrays empty when none are configured.
   */
  inLecturePopupElements: InLecturePopupElements
}
