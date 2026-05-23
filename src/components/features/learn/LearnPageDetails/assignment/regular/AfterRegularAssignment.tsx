'use client'

import { AssignmentPhaseContent } from '../shared/AssignmentPhaseContent'

type AfterRegularAssignmentProps = {
  schedule: string | null
}

export function AfterRegularAssignment({ schedule }: AfterRegularAssignmentProps) {
  return <AssignmentPhaseContent kind="assignment" phase="after" schedule={schedule} />
}
