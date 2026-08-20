import type { AssignmentDetailFooter } from '@/server/learn/assignmentDetailFooterTypes'
import type { AssignmentKind } from '@/server/learn/assignmentDetailTypes'
import {
  buildAssignmentFooterActions,
  type BuildAssignmentFooterActionsInput,
} from '@/server/learn/utils/buildAssignmentFooterActions'
import {
  calculateAssignmentProgressStatus,
  type AssignmentProgressStatus,
} from '@/server/learn/utils/calculateAssignmentProgressStatus'
import {
  isAssessmentPlatform,
  readAssignmentSettingsCase,
  readAssignmentSettingsFlag,
} from '@/server/learn/utils/assignmentPlatform'
import { parseIstToMs } from '@/server/time/istClock'

export type AssignmentDetailFooterContext = {
  assignmentKind: AssignmentKind
  category: string
  platform: string | null
  showScores: boolean
  showSubmission: boolean
  settings: Record<string, unknown> | null
  schedule: string | null
  concludes: string | null
  nowMs: number
  problemCount: number
  submission: {
    id: number
    completed: boolean
    status: string | null
    markAsCompleted: boolean | null
    score: number
    startedAt: string | null
    completedAt: string | null
    data: Record<string, unknown> | null
  } | null
}

const STATUS_LABELS: Record<AssignmentProgressStatus, string> = {
  new: 'New',
  'in-progress': 'In Progress',
  overdue: 'Over Due',
  completed: 'Complete',
}

function isAssignmentUnlocked(schedule: string | null, nowMs: number): boolean {
  const scheduleMs = parseIstToMs(schedule)
  if (scheduleMs == null) return true
  return nowMs >= scheduleMs
}

export function isAssignmentExpired(
  settings: Record<string, unknown> | null,
  concludes: string | null,
  nowMs: number,
): boolean {
  if (readAssignmentSettingsCase(settings) === 'case1') return false
  const concludesMs = parseIstToMs(concludes)
  if (concludesMs == null) return false
  return nowMs > concludesMs
}

function resolveGradedScore(
  submission: AssignmentDetailFooterContext['submission'],
): number | null {
  if (submission == null) return null
  const data = submission.data
  const isGraded =
    data?.updatedScore === true || data?.scoreUpdatedByAdmin === true
  return isGraded ? submission.score : null
}

function readAssessPlatformLink(
  data: Record<string, unknown> | null,
): string | null {
  const link = data?.assess_platform_link
  return typeof link === 'string' && link.trim() !== '' ? link : null
}

/**
 * Assignments store the graded-evaluation category as `graded-evaluation`, but
 * `category` is a free-form varchar, so normalize separators before matching.
 */
function isGradedEvaluationCategory(category: string): boolean {
  return (
    category
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ') === 'graded evaluation'
  )
}

function shouldShowStatusChip(
  status: AssignmentProgressStatus,
  assignmentKind: AssignmentKind,
): boolean {
  if (status === 'new') return false
  if (status === 'overdue' && assignmentKind === 'evaluation') return false
  if (status === 'overdue' && assignmentKind === 'practice') return false
  return true
}

function buildScoreBlock(
  context: AssignmentDetailFooterContext,
): AssignmentDetailFooter['score'] {
  if (!context.showScores) return null
  // Match old LMS: the "Score yet to be released" tag only appears once a
  // submission exists (old LMS keys off `final_score === null`, which requires
  // a submission row). No submission => no score chip at all.
  if (context.submission == null) return null
  const gradedScore = resolveGradedScore(context.submission)
  if (gradedScore == null) {
    return {
      state: 'pending',
      score: null,
      label: 'Score yet to be released',
    }
  }
  const displayScore = Math.min(gradedScore, 10)
  return {
    state: 'released',
    score: displayScore,
    label: `You obtained ${displayScore.toFixed(2)}/10`,
  }
}

function buildNotices(
  context: AssignmentDetailFooterContext,
  isExpired: boolean,
): AssignmentDetailFooter['notices'] {
  const notices: AssignmentDetailFooter['notices'] = []

  if (context.problemCount === 0) {
    if (context.assignmentKind === 'practice') {
      notices.push({
        variant: 'score-policy',
        message: 'Practice assignment score will not be considered.',
      })
    }
    // Only graded evaluations count toward final grading, so the notice is
    // limited to `type = evaluation` + `category = graded evaluation`.
    if (
      context.assignmentKind === 'evaluation' &&
      isGradedEvaluationCategory(context.category)
    ) {
      notices.push({
        variant: 'score-policy',
        message: 'Evaluation Score will be considered',
      })
    }
  }

  const showPractice =
    isExpired &&
    context.category.trim().toLowerCase() !== 'marathon' &&
    context.assignmentKind !== 'evaluation'

  const startedAfterDeadline =
    context.submission?.startedAt != null &&
    parseIstToMs(context.concludes) != null &&
    parseIstToMs(context.submission.startedAt)! >
      parseIstToMs(context.concludes)!

  if (
    showPractice &&
    isAssessmentPlatform(context.platform) &&
    startedAfterDeadline
  ) {
    notices.push({
      variant: 'practice-after-deadline',
      message:
        'Feel free to practice the assignment at your own pace. Please note that it will not be graded, as the submission deadline has passed.',
    })
  }

  return notices
}

export function buildAssignmentDetailFooter(
  context: AssignmentDetailFooterContext,
): AssignmentDetailFooter {
  const progressStatus = calculateAssignmentProgressStatus({
    schedule: context.schedule,
    concludes: context.concludes,
    nowMs: context.nowMs,
    submission: context.submission,
  })

  const isUnlocked = isAssignmentUnlocked(context.schedule, context.nowMs)
  const isExpired = isAssignmentExpired(
    context.settings,
    context.concludes,
    context.nowMs,
  )

  const showPractice =
    isExpired &&
    context.category.trim().toLowerCase() !== 'marathon' &&
    context.assignmentKind !== 'evaluation'

  const submissionSnapshot =
    context.submission == null
      ? null
      : {
          completed: context.submission.completed,
          startedAt: context.submission.startedAt,
          completedAt: context.submission.completedAt,
          assessPlatformLink: readAssessPlatformLink(context.submission.data),
          scoreUpdated:
            context.submission.data?.updatedScore === true ||
            context.submission.data?.scoreUpdatedByAdmin === true,
        }

  const actionsInput: BuildAssignmentFooterActionsInput = {
    assignmentKind: context.assignmentKind,
    platform: context.platform,
    showSubmission: context.showSubmission === true,
    hideShowSubmissionButton: readAssignmentSettingsFlag(
      context.settings,
      'hideShowSubmissionButton',
    ),
    isUnlocked,
    isExpired,
    showPractice,
    submission: submissionSnapshot,
  }

  const actions =
    context.problemCount === 0 ? buildAssignmentFooterActions(actionsInput) : []

  const assessPlatformLink = readAssessPlatformLink(
    context.submission?.data ?? null,
  )

  return {
    visible: context.problemCount === 0,
    meta: {
      submissionId: context.submission?.id ?? null,
      assessPlatformLink,
      platform: context.platform,
    },
    statusChip: shouldShowStatusChip(progressStatus, context.assignmentKind)
      ? {
          status: progressStatus,
          label: STATUS_LABELS[progressStatus],
        }
      : null,
    showPracticeModeChip:
      progressStatus === 'overdue' && context.assignmentKind === 'practice',
    score: buildScoreBlock(context),
    notices: buildNotices(context, isExpired),
    actions,
  }
}
