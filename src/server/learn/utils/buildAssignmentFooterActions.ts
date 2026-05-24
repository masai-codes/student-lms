import type {
  AssignmentFooterAction,
  AssignmentFooterActionKind,
} from '@/server/learn/assignmentDetailFooterTypes'
import { isAssessmentPlatform } from '@/server/learn/utils/assignmentPlatform'

type SubmissionSnapshot = {
  completed: boolean
  startedAt: string | null
  completedAt: string | null
  assessPlatformLink: string | null
  scoreUpdated: boolean
}

export type BuildAssignmentFooterActionsInput = {
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
        action('start-assessment', 'Start Assignment', 'primary', true),
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
        submission.assessPlatformLink ? 'Continue Assignment' : 'Start Assignment',
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
