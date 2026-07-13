import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type { LearnListingCardCtas } from '@/server/learn/types'
import type { AssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'
import { isLectureSessionEnded } from '@/server/learn/utils/isLectureSessionEnded'
import { resolveJoinLiveButtonState } from '@/server/learn/utils/resolveJoinLiveButtonState'
import { resolveAssignmentListingStatusChip } from '@/server/learn/utils/resolveAssignmentListingStatusChip'
import { computeDeadlineCountdown } from '@/server/learn/utils/computeDeadlineCountdown'
import { scrubZoomLinkForSchedule } from '@/server/learn/utils/scrubZoomLinkForSchedule'
import { toLectureScopedAdaptiveLink } from '@/server/learn/utils/toLectureScopedAdaptiveLink'

export function buildLearnListingCardCtas(input: {
  learningType: 'lecture' | 'assignment' | 'resource'
  lectureId: number
  itemType: string
  schedule: string | null
  concludes: string | null
  isMandatory: boolean
  zoomLink: string | null
  isNewZoomRedirection: boolean
  nowMs: number
  attendance: LectureAttendanceSummary | null
  assignmentProgressStatus: AssignmentProgressStatus | null
  /** Released score (clamped to 10); null unless `showScores` is on and the score is released. */
  assignmentScore: number | null
}): LearnListingCardCtas {
  if (input.learningType === 'assignment') {
    return {
      joinLive: 'hidden',
      joinZoomLink: null,
      isNewZoomRedirection: false,
      showAttendance: false,
      assignmentStatusChip: resolveAssignmentListingStatusChip(
        input.assignmentProgressStatus,
        input.itemType,
      ),
      assignmentDeadlineLabel:
        computeDeadlineCountdown(input.concludes, input.nowMs)?.label ?? null,
      assignmentScore: input.assignmentScore,
    }
  }

  if (input.learningType === 'resource') {
    return {
      joinLive: 'hidden',
      joinZoomLink: null,
      isNewZoomRedirection: false,
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
    showAttendance,
    assignmentStatusChip: null,
    assignmentDeadlineLabel: null,
    assignmentScore: null,
  }
}
