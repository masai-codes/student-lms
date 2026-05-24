'use client'

import { AssignmentPhaseContent } from '../shared/AssignmentPhaseContent'

import type { LearnPhaseContent } from '@/server/learn/learnPhaseContentTypes'
import { MasaiButton } from '@/components/ui/masai-button'

type DuringEvaluationAssignmentProps = {
  content: LearnPhaseContent
}

export function DuringEvaluationAssignment({ content }: DuringEvaluationAssignmentProps) {
  return (
    <AssignmentPhaseContent
      content={content}
      action={
        <MasaiButton type="primary" size="md" ctaText="Start evaluation" disabled />
      }
    />
  )
}
