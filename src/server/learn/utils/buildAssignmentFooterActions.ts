import type {
  AssignmentFooterAction,
  AssignmentFooterActionKind,
} from '@/server/learn/assignmentDetailFooterTypes'
import type { AssignmentKind } from '@/server/learn/assignmentDetailTypes'
import { isAssessmentPlatform } from '@/server/learn/utils/assignmentPlatform'
import { getAssignmentFooterActionLabels } from '@/server/learn/utils/getAssignmentFooterActionLabels'

type SubmissionSnapshot = {
  completed: boolean
  startedAt: string | null
  completedAt: string | null
  assessPlatformLink: string | null
  scoreUpdated: boolean
}

export type BuildAssignmentFooterActionsInput = {
  assignmentKind: AssignmentKind
  platform: string | null
  showSubmission: boolean
  hideShowSubmissionButton: boolean
  isUnlocked: boolean
  isExpired: boolean
  showPractice: boolean
  submission: SubmissionSnapshot | null
}

function action(
  kind: AssignmentFooterActionKind,
  label: string,
  variant: 'primary' | 'secondary',
  enabled: boolean,
): AssignmentFooterAction {
  return { kind, label, variant, enabled }
}

export function buildAssignmentFooterActions(
  input: BuildAssignmentFooterActionsInput,
): Array<AssignmentFooterAction> {
  if (!input.isUnlocked) {
    return []
  }

  const ctaLabels = getAssignmentFooterActionLabels(input.assignmentKind)

  if (!isAssessmentPlatform(input.platform)) {
    if (input.submission == null) {
      return []
    }
    const completed = input.submission.completed
    return [
      action(
        'toggle-completion',
        completed ? 'Mark as incomplete' : 'Mark as completed',
        'primary',
        true,
      ),
    ]
  }

  const submission = input.submission
  const actions: Array<AssignmentFooterAction> = []

  if (submission == null) {
    if (!input.isExpired) {
      actions.push(
        action('start-assessment', ctaLabels.start, 'primary', true),
      )
    }
    return actions
  }

  if (
    !input.isExpired &&
    !submission.scoreUpdated &&
    !submission.completed
  ) {
    actions.push(
      action(
        submission.assessPlatformLink ? 'continue-assessment' : 'start-assessment',
        submission.assessPlatformLink ? ctaLabels.continue : ctaLabels.start,
        'primary',
        true,
      ),
    )
  }

  if (input.showPractice) {
    actions.push(
      action('practice-assessment', 'Practice', 'secondary', true),
    )
  }

  const showSubmissionCta =
    Boolean(submission.assessPlatformLink) &&
    (Boolean(submission.completedAt) ||
      submission.completed ||
      input.isExpired) &&
    input.showSubmission &&
    !input.hideShowSubmissionButton

  if (showSubmissionCta) {
    actions.push(
      action('show-submission', 'Show Submission', 'primary', true),
    )
  }

  return actions
}
