'use client'

import { LearnPhaseContentSection } from '../../common/LearnPhaseContentSection'

import type { LearnPhaseContent } from '@/server/learn/learnPhaseContentTypes'

type ResourcePhaseContentProps = {
  content: LearnPhaseContent
}

export function ResourcePhaseContent({ content }: ResourcePhaseContentProps) {
  return <LearnPhaseContentSection content={content} />
}
