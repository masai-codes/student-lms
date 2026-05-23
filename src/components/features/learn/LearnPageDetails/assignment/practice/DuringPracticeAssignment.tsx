'use client'

import { AssignmentPhaseContent } from '../shared/AssignmentPhaseContent'

import { MasaiButton } from '@/components/ui/masai-button'

type DuringPracticeAssignmentProps = {
  schedule: string | null
}

export function DuringPracticeAssignment({ schedule }: DuringPracticeAssignmentProps) {
  return (
    <AssignmentPhaseContent
      kind="practice"
      phase="during"
      schedule={schedule}
      action={
        <MasaiButton type="primary" size="md" ctaText="Start practice" disabled />
      }
    />
  )
}
