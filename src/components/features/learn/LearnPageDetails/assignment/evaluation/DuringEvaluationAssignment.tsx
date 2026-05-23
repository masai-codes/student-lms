'use client'

import { AssignmentPhaseContent } from '../shared/AssignmentPhaseContent'

import { MasaiButton } from '@/components/ui/masai-button'

type DuringEvaluationAssignmentProps = {
  schedule: string | null
}

export function DuringEvaluationAssignment({
  schedule,
}: DuringEvaluationAssignmentProps) {
  return (
    <AssignmentPhaseContent
      kind="evaluation"
      phase="during"
      schedule={schedule}
      action={
        <MasaiButton type="primary" size="md" ctaText="Start evaluation" disabled />
      }
    />
  )
}
