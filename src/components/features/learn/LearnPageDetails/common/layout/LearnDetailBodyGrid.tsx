'use client'

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type LearnDetailBodyGridProps = {
  mainPlaceholder?: string
  asidePlaceholder?: string
  main?: ReactNode
  aside?: ReactNode
}

/**
 * 70 / 10-cols main + 30% aside shell; entity pages pass copy or real nodes.
 *
 * The main column grows with its content and scrolls with the page — no inner
 * scrollbar — so long bodies (e.g. assignment instructions) expand as tall as
 * they need. Only the aside is pinned to a full-viewport-height pane on desktop
 * (`lg:sticky` + `lg:h-[calc(100dvh-…)]` + `lg:overflow-y-auto`) so growing
 * discussions/replies scroll internally instead of dragging the shared grid
 * row's height. `~104px` accounts for the sticky navbar (~72px) plus the pane's
 * top gap and a small bottom breather. On mobile the grid collapses to a single
 * stacked column (`grid-cols-1`) and the stick/height/overflow classes are
 * inert, so the natural flow is kept.
 */
export function LearnDetailBodyGrid({
  mainPlaceholder,
  asidePlaceholder,
  main,
  aside,
}: LearnDetailBodyGridProps) {
  return (
    <section className="grid grid-cols-1 items-start gap-4 lg:grid-cols-10">
      <div
        className={cn(
          'min-h-[200px] rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-[#4F6BED]/25 md:p-6 lg:col-span-7',
          !main && 'border-dashed border-gray-300 bg-gray-50/80',
        )}
      >
        {main ?? (
          <p className="type-b2-regular text-muted-foreground">
            {mainPlaceholder ?? ''}
          </p>
        )}
      </div>
      <div className="flex min-h-[200px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-[#4F6BED]/25 md:p-6 lg:sticky lg:top-[84px] lg:col-span-3 lg:h-[calc(100dvh-104px)]">
        {aside ?? (
          <p className="type-b2-regular text-muted-foreground">
            {asidePlaceholder ?? ''}
          </p>
        )}
      </div>
    </section>
  )
}
