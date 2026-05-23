'use client'

import { AssignmentPhaseContent } from '../shared/AssignmentPhaseContent'

type BeforeEvaluationAssignmentProps = {
  schedule: string | null
}

export function BeforeEvaluationAssignment({
  schedule,
}: BeforeEvaluationAssignmentProps) {
  return <AssignmentPhaseContent kind="evaluation" phase="before" schedule={schedule} />
}
