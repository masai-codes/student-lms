'use client'

import { AssignmentPhaseContent } from '../shared/AssignmentPhaseContent'

type AfterPracticeAssignmentProps = {
  schedule: string | null
}

export function AfterPracticeAssignment({ schedule }: AfterPracticeAssignmentProps) {
  return <AssignmentPhaseContent kind="practice" phase="after" schedule={schedule} />
}
