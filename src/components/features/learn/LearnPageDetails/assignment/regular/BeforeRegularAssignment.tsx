'use client'

import { AssignmentPhaseContent } from '../shared/AssignmentPhaseContent'

type BeforeRegularAssignmentProps = {
  schedule: string | null
}

export function BeforeRegularAssignment({ schedule }: BeforeRegularAssignmentProps) {
  return <AssignmentPhaseContent kind="assignment" phase="before" schedule={schedule} />
}
