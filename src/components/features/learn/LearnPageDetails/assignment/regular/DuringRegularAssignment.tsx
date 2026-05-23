'use client'

import { AssignmentPhaseContent } from '../shared/AssignmentPhaseContent'

import { MasaiButton } from '@/components/ui/masai-button'

type DuringRegularAssignmentProps = {
  schedule: string | null
}

export function DuringRegularAssignment({ schedule }: DuringRegularAssignmentProps) {
  return (
    <AssignmentPhaseContent
      kind="assignment"
      phase="during"
      schedule={schedule}
      action={
        <MasaiButton type="primary" size="md" ctaText="Open assignment" disabled />
      }
    />
  )
}
