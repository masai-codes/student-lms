'use client'

import { AssignmentPhaseContent } from '../shared/AssignmentPhaseContent'

type BeforePracticeAssignmentProps = {
  schedule: string | null
}

export function BeforePracticeAssignment({ schedule }: BeforePracticeAssignmentProps) {
  return <AssignmentPhaseContent kind="practice" phase="before" schedule={schedule} />
}
