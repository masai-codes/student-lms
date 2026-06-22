import {
  isAssessmentPlatform,
  readAssignmentSettingsFlag,
} from '@/server/learn/utils/assignmentPlatform'

/** Live progress metrics from the Assessment Platform (null when a metric is absent). */
export type AssignmentLiveAnalytics = {
  totalQuestions: number | null
  attempted: number | null
  notGraded: number | null
  correct: number | null
  wrong: number | null
}

export type AssignmentLiveAnalyticsInput = {
  platform: string | null
  settings: Record<string, unknown> | null
  submission: {
    data: Record<string, unknown> | null
  } | null
}

function readNumber(
  data: Record<string, unknown> | null,
  key: string,
): number | null {
  const value = data?.[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function resolveNotGraded(
  attempted: number | null,
  graded: number | null,
): number | null {
  if (attempted == null || graded == null) return null
  return attempted - graded
}

/**
 * Live analytics are only shown for an Assessment Platform assignment when live
 * progress is enabled and the learner has actually launched the test.
 */
export function buildAssignmentLiveAnalytics(
  input: AssignmentLiveAnalyticsInput,
): AssignmentLiveAnalytics | null {
  const linkClicked =
    input.submission?.data?.['assess_platform_link_clicked'] === true

  if (
    !isAssessmentPlatform(input.platform) ||
    !readAssignmentSettingsFlag(input.settings, 'liveProgress') ||
    input.submission == null ||
    !linkClicked
  ) {
    return null
  }

  const data = input.submission.data
  const attempted = readNumber(data, 'totalAttempted')
  const graded = readNumber(data, 'gradedQuestions')

  return {
    totalQuestions: readNumber(data, 'totalQuestions'),
    attempted,
    notGraded: resolveNotGraded(attempted, graded),
    correct: readNumber(data, 'correctAnswers'),
    wrong: readNumber(data, 'wrongAnswers'),
  }
}
