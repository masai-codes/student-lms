'use client'

import { AssignmentPhaseContent } from '../shared/AssignmentPhaseContent'

import type { LearnPhaseContent } from '@/server/learn/learnPhaseContentTypes'

type DuringEvaluationAssignmentProps = {
  content: LearnPhaseContent
}

export function DuringEvaluationAssignment({ content }: DuringEvaluationAssignmentProps) {
  return <AssignmentPhaseContent content={content} />
}
