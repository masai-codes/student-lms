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
      <h2 className="type-h6 text-foreground">{content.title}</h2>
      <p className="type-b2-regular text-foreground-muted">
        {content.description}
        {content.scheduleHint ? (
          <>
            {' '}
            <span className="type-b2-md inline-flex max-w-full items-center rounded-full bg-brand/10 px-2.5 py-0.5 text-brand">
              {content.scheduleHint}
            </span>
          </>
        ) : null}
      </p>
      {action ? <div className="pt-1">{action}</div> : null}
    </section>
  )
}
