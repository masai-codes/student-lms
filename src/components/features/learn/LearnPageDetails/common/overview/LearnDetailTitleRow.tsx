'use client'

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type LearnDetailTitleRowProps = {
  title: string
  actions?: ReactNode
  /** Extra classes on the heading only. */
  titleClassName?: string
}

/** Title opposite CTAs (matches original learn-detail header layout). */
export function LearnDetailTitleRow({
  title,
  actions,
  titleClassName,
}: LearnDetailTitleRowProps) {
  return (
    <section className="flex flex-col gap-4 justify-between sm:flex-row sm:items-start">
      <h1
        className={cn(
          'type-h4 max-w-[min(100%,48rem)] min-w-0 pr-4 text-foreground',
          titleClassName,
        )}
      >
        {title}
      </h1>
      {actions != null ? (
        // Hover/press physics for whatever action buttons a page injects here.
        <div className="flex shrink-0 flex-wrap items-center gap-3 [&_button]:transition-all [&_button]:duration-200 [&_button]:hover:-translate-y-px [&_button]:active:translate-y-0 [&_button]:active:scale-95">
          {actions}
        </div>
      ) : null}
    </section>
  )
}
