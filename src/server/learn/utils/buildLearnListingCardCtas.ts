import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type { LearnListingCardCtas } from '@/server/learn/types'
import type { AssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'
import { isLectureSessionEnded } from '@/server/learn/utils/isLectureSessionEnded'
import { resolveJoinLiveButtonState } from '@/server/learn/utils/resolveJoinLiveButtonState'
import { resolveAssignmentListingStatusChip } from '@/server/learn/utils/resolveAssignmentListingStatusChip'
import { computeDeadlineCountdown } from '@/server/learn/utils/computeDeadlineCountdown'
import { scrubZoomLinkForSchedule } from '@/server/learn/utils/scrubZoomLinkForSchedule'
import {
  isAdaptiveLectureLink,
  toLectureScopedAdaptiveLink,
} from '@/server/learn/utils/toLectureScopedAdaptiveLink'
import { parseIstToMs } from '@/server/time/istClock'

export function buildLearnListingCardCtas(input: {
  learningType: 'lecture' | 'assignment' | 'resource'
  lectureId: number
  itemType: string
  schedule: string | null
  concludes: string | null
  isMandatory: boolean
  zoomLink: string | null
  isNewZoomRedirection: boolean
  /** `sections.settings.enableZoomWebView` — routes the join CTA to the old LMS embed. */
  enableZoomWebView: boolean
  nowMs: number
  attendance: LectureAttendanceSummary | null
  assignmentProgressStatus: AssignmentProgressStatus | null
  /** Released score (clamped to 10); null unless `showScores` is on and the score is released. */
  assignmentScore: number | null
}): LearnListingCardCtas {
  if (input.learningType === 'assignment') {
    // Only surface the countdown while the assignment window is open
    // (schedule <= now < concludes) and the learner hasn't completed it.
    // The upper bound (now < concludes) is enforced by computeDeadlineCountdown
    // returning null once the deadline has passed.
    const scheduleMs = parseIstToMs(input.schedule)
    const isUnlocked = scheduleMs == null || input.nowMs >= scheduleMs
    const isCompleted = input.assignmentProgressStatus === 'completed'
    const assignmentDeadlineLabel =
      isUnlocked && !isCompleted
        ? (computeDeadlineCountdown(input.concludes, input.nowMs)?.label ??
          null)
        : null

    return {
      joinLive: 'hidden',
      joinZoomLink: null,
      isNewZoomRedirection: false,
      enableZoomWebView: false,
      showAttendance: false,
      assignmentStatusChip: resolveAssignmentListingStatusChip(
        input.assignmentProgressStatus,
        input.itemType,
      ),
      assignmentDeadlineLabel,
      assignmentScore: input.assignmentScore,
    }
  }

  if (input.learningType === 'resource') {
    return {
      joinLive: 'hidden',
      joinZoomLink: null,
      isNewZoomRedirection: false,
      enableZoomWebView: false,
      showAttendance: false,
      assignmentStatusChip: null,
      assignmentDeadlineLabel: null,
      assignmentScore: null,
    }
  }

  const isLiveLike = input.itemType === 'live' || input.itemType === 'scrum'
  const joinLive = isLiveLike
    ? resolveJoinLiveButtonState({
        schedule: input.schedule,
        concludes: input.concludes,
        nowMs: input.nowMs,
        zoomLink: input.zoomLink,
      })
    : 'hidden'

  // The clickable join URL (scrubbed until the session is near, lecture-scoped),
  // mirroring the lecture detail page. Only surfaced when the button shows.
  const scrubbedLink =
    joinLive === 'hidden'
      ? null
      : scrubZoomLinkForSchedule({
          zoomLink: input.zoomLink,
          schedule: input.schedule,
          nowMs: input.nowMs,
        })
  const joinZoomLink = scrubbedLink
    ? toLectureScopedAdaptiveLink(scrubbedLink, input.lectureId)
    : null

  const showAttendance =
    input.isMandatory &&
    isLectureSessionEnded({
      schedule: input.schedule,
      concludes: input.concludes,
      nowMs: input.nowMs,
    })

  return {
    joinLive,
    joinZoomLink,
    isNewZoomRedirection: input.isNewZoomRedirection,
    // Web View only applies to a shown, non-adaptive join link (SAL keeps its
    // own redirect) that isn't a ZEF lecture; mirrors the old LMS join ladder.
    enableZoomWebView:
      input.enableZoomWebView &&
      joinZoomLink != null &&
      !input.isNewZoomRedirection &&
      !isAdaptiveLectureLink(joinZoomLink),
    showAttendance,
    assignmentStatusChip: null,
    assignmentDeadlineLabel: null,
    assignmentScore: null,
  }
}
