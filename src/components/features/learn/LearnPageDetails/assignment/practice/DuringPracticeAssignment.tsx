'use client'

import { AssignmentPhaseContent } from '../shared/AssignmentPhaseContent'

import type { LearnPhaseContent } from '@/server/learn/learnPhaseContentTypes'
import { MasaiButton } from '@/components/ui/masai-button'

type DuringPracticeAssignmentProps = {
  content: LearnPhaseContent
}

export function DuringPracticeAssignment({ content }: DuringPracticeAssignmentProps) {
  return (
    <AssignmentPhaseContent
      content={content}
      action={
        <MasaiButton type="primary" size="md" ctaText="Start practice" disabled />
      }
    />
  )
}
