'use client'

import { LearnPhaseContentSection } from '../../common/LearnPhaseContentSection'

import type { LearnPhaseContent } from '@/server/learn/learnPhaseContentTypes'
import type { ReactNode } from 'react'

type AssignmentPhaseContentProps = {
  content: LearnPhaseContent
  action?: ReactNode
}

export function AssignmentPhaseContent({ content, action }: AssignmentPhaseContentProps) {
  return <LearnPhaseContentSection content={content} action={action} />
}
