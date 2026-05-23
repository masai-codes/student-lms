'use client'

import { AssignmentPhaseContent } from '../shared/AssignmentPhaseContent'

type AfterEvaluationAssignmentProps = {
  schedule: string | null
}

export function AfterEvaluationAssignment({
  schedule,
}: AfterEvaluationAssignmentProps) {
  return <AssignmentPhaseContent kind="evaluation" phase="after" schedule={schedule} />
}
