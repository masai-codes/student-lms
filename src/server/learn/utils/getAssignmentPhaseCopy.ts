import type {
  AssignmentKind,
  AssignmentPhase,
} from '@/server/learn/assignmentDetailTypes'

type AssignmentPhaseCopy = {
  title: string
  description: string
}

const COPY: Record<
  AssignmentKind,
  Record<AssignmentPhase, AssignmentPhaseCopy>
> = {
  practice: {
    before: {
      title: 'Practice assignment not open yet',
      description:
        'This practice set unlocks at the scheduled time. Scores are for your learning and are not counted toward evaluation.',
    },
    during: {
      title: 'Practice assignment is open',
      description:
        'Work through the problems at your own pace. You can revisit this practice after the window ends if practice mode stays enabled.',
    },
    after: {
      title: 'Practice assignment window has ended',
      description:
        'Review your work and solutions. Practice scores are not counted toward your course evaluation.',
    },
  },
  assignment: {
    before: {
      title: 'Assignment not open yet',
      description:
        'This assignment unlocks at the scheduled time. Return here when it opens to start your submission.',
    },
    during: {
      title: 'Assignment is open',
      description:
        'Complete and submit your work before the deadline. Check the instructions below before you begin.',
    },
    after: {
      title: 'Assignment window has ended',
      description:
        'The submission window is closed. Review your submission status and any released scores below.',
    },
  },
  evaluation: {
    before: {
      title: 'Evaluation not open yet',
      description:
        'This evaluation unlocks at the scheduled time. Be ready to start promptly when the window opens.',
    },
    during: {
      title: 'Evaluation in progress',
      description:
        'Complete the evaluation within the allotted window. Your score may count toward course assessment.',
    },
    after: {
      title: 'Evaluation window has ended',
      description:
        'The evaluation is closed. Scores will appear here once they are released by your instructor.',
    },
  },
}

export function getAssignmentPhaseCopy(
  kind: AssignmentKind,
  phase: AssignmentPhase,
): AssignmentPhaseCopy {
  return COPY[kind][phase]
}
