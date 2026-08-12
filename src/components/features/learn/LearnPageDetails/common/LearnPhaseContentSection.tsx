'use client'

import { Lock } from '@phosphor-icons/react'
import type { LearnPhaseContent } from '@/server/learn/learnPhaseContentTypes'
import type { ReactNode } from 'react'

type LearnPhaseContentSectionProps = {
  content: LearnPhaseContent
  action?: ReactNode
  /** Show a lock icon next to the title for not-yet-unlocked (before) states. */
  showLockIcon?: boolean
}

export function LearnPhaseContentSection({
  content,
  action,
  showLockIcon = false,
}: LearnPhaseContentSectionProps) {
  return (
    <section className="animate-dash-rise space-y-3">
      <h2 className="type-h6 flex items-center gap-2 text-foreground">
        {showLockIcon ? (
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-500 p-1.5 dark:bg-brand"
            aria-hidden
          >
            <Lock
              weight="duotone"
              className="animate-dash-float size-4 text-white"
            />
          </span>
        ) : null}
        {content.title}
      </h2>
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
