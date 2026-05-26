'use client'

import { AssignmentPhaseContent } from '../shared/AssignmentPhaseContent'

import type { LearnPhaseContent } from '@/server/learn/learnPhaseContentTypes'

type DuringRegularAssignmentProps = {
  content: LearnPhaseContent
}

export function DuringRegularAssignment({ content }: DuringRegularAssignmentProps) {
  return <AssignmentPhaseContent content={content} />
}
