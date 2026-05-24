'use client'

import { AssignmentPhaseContent } from '../shared/AssignmentPhaseContent'

import type { LearnPhaseContent } from '@/server/learn/learnPhaseContentTypes'
import { MasaiButton } from '@/components/ui/masai-button'

type DuringRegularAssignmentProps = {
  content: LearnPhaseContent
}

export function DuringRegularAssignment({ content }: DuringRegularAssignmentProps) {
  return (
    <AssignmentPhaseContent
      content={content}
      action={
        <MasaiButton type="primary" size="md" ctaText="Start assignment" disabled />
      }
    />
  )
}
