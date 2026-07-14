'use client'

import type { LearnPhaseContent } from '@/server/learn/learnPhaseContentTypes'
import type { ReactNode } from 'react'

type LearnPhaseContentSectionProps = {
  content: LearnPhaseContent
  action?: ReactNode
}

export function LearnPhaseContentSection({
  content,
  action,
}: LearnPhaseContentSectionProps) {
  return (
    <section className="animate-dash-rise space-y-3">
      <h2 className="type-h6 text-gray-900">{content.title}</h2>
      <p className="type-b2-regular text-gray-600">
        {content.description}
        {content.scheduleHint ? (
          <>
            {' '}
            <span className="type-b2-md inline-flex max-w-full items-center rounded-full bg-[#4F6BED]/10 px-2.5 py-0.5 text-[#4F6BED]">
              {content.scheduleHint}
            </span>
          </>
        ) : null}
      </p>
      {action ? <div className="pt-1">{action}</div> : null}
    </section>
  )
}
