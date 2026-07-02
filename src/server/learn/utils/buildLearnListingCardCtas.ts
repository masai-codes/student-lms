import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type { LearnListingCardCtas } from '@/server/learn/types'
import type { AssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'
import { isLectureSessionEnded } from '@/server/learn/utils/isLectureSessionEnded'
import { resolveJoinLiveButtonState } from '@/server/learn/utils/resolveJoinLiveButtonState'
import { resolveAssignmentListingStatusChip } from '@/server/learn/utils/resolveAssignmentListingStatusChip'
import { computeDeadlineCountdown } from '@/server/learn/utils/computeDeadlineCountdown'

export function buildLearnListingCardCtas(input: {
  learningType: 'lecture' | 'assignment' | 'resource'
  itemType: string
  schedule: string | null
  concludes: string | null
  isMandatory: boolean
  zoomLink: string | null
  nowMs: number
  attendance: LectureAttendanceSummary | null
  assignmentProgressStatus: AssignmentProgressStatus | null
}): LearnListingCardCtas {
  if (input.learningType === 'assignment') {
    return {
      joinLive: 'hidden',
      showAttendance: false,
      assignmentStatusChip: resolveAssignmentListingStatusChip(
        input.assignmentProgressStatus,
        input.itemType,
      ),
      assignmentDeadlineLabel:
        computeDeadlineCountdown(input.concludes, input.nowMs)?.label ?? null,
    }
  }

  if (input.learningType === 'resource') {
    return {
      joinLive: 'hidden',
      showAttendance: false,
      assignmentStatusChip: null,
      assignmentDeadlineLabel: null,
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

  const showAttendance =
    input.isMandatory &&
    isLectureSessionEnded({
      schedule: input.schedule,
      concludes: input.concludes,
      nowMs: input.nowMs,
    })

  return {
    joinLive,
    showAttendance,
    assignmentStatusChip: null,
    assignmentDeadlineLabel: null,
  }
}
