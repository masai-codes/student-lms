import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type { LearnHubDetailPayload, LearningItem } from '@/server/learn/types'
import type { LectureAiChatSuggestion } from '@/server/learn/utils/buildLectureAiChatSuggestions'
import type { JoinLiveButtonState } from '@/server/learn/utils/resolveJoinLiveButtonState'
import type { InLecturePopupQuiz } from '@/server/learn/utils/parseLectureSettings'
import type { WatchIntervalSegment } from '@/server/video-attendance/types'

export type { InLecturePopupQuiz }
export type {
  LectureAiChatSuggestion,
  LectureAiChatSuggestionKind,
} from '@/server/learn/utils/buildLectureAiChatSuggestions'

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
 * `effectiveScheduledAt`, falling back to `scheduledAt`, is the reference point
 * for converting the elements' absolute `startTimestamp` / `endTimestamp` into
 * the video-relative show window.
 */
export type InLecturePopupMetaData = {
  id: number
  lectureId: number
  /** The session's nominal start — when it was *meant* to begin. */
  scheduledAt: string | null
  /**
   * `meta.effectiveScheduledAt.value`: the recording-aware video t=0 ZEF syncs
   * once the recording exists, already accounting for a late start and any
   * leading trim. Null for lectures ZEF hasn't synced, where `scheduledAt` is
   * the origin instead. Exposed so a consumer can tell which origin the
   * `startSec` / `endSec` windows were measured from.
   */
  effectiveScheduledAt: string | null
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
  /**
   * `'zef'` when the lecture has a `zef_lms_meta_data` row *and* the user
   * attended — tagged feedback, always open, saved to
   * `zef_lms_feedback_submissions`. `'hidden'` when the meta row exists but the
   * user did not attend: the form renders nothing at all, since a ZEF-owned
   * lecture never falls back to the legacy flow. `'legacy'` only when there is
   * no meta row — the original rating+text flow, window-gated, no tags, saved
   * to `lecture_feedback`.
   */
  mode: 'zef' | 'legacy' | 'hidden'
  /**
   * Whether the feedback form is open for submission. Always true in `zef`
   * mode, always false in `hidden` mode.
   */
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
  /**
   * In-lecture popup elements (quizzes + polls) to surface while the recording
   * plays, sourced from the ZEF ⇆ LMS tables (`zef_lms_meta_data` → `zef_lms_quiz`
   * / `zef_lms_polls_questions`). Both arrays empty when none are configured.
   */
  inLecturePopupElements: InLecturePopupElements
  /**
   * Chat empty-state suggestion chips: up to 3 randomized lecture FAQs
   * (`kind: 'faq'`) followed by the three generic prompts (summary / explain /
   * quiz). Combined list is capped at 6. Built server-side so web and mobile
   * share one source of truth.
   */
  aiChatSuggestions: Array<LectureAiChatSuggestion>
}
