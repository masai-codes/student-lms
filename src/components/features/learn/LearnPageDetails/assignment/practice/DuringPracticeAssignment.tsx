'use client'

import { AssignmentPhaseContent } from '../shared/AssignmentPhaseContent'

import type { LearnPhaseContent } from '@/server/learn/learnPhaseContentTypes'

type DuringPracticeAssignmentProps = {
  content: LearnPhaseContent
}

export function DuringPracticeAssignment({ content }: DuringPracticeAssignmentProps) {
  return <AssignmentPhaseContent content={content} />
}
