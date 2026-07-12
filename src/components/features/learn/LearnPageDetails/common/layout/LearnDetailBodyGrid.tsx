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
 * On desktop (`lg`) both columns are pinned to a full-viewport-height pane
 * (`lg:sticky` + `lg:h-[calc(100dvh-…)]`) and scroll their own overflow. This
 * decouples the two columns: when the aside's discussion/replies grow, the
 * aside scrolls internally instead of stretching the shared grid row and
 * dragging the main column's height along with it. `~104px` accounts for the
 * sticky navbar (~72px) plus the pane's top gap and a small bottom breather.
 * On mobile the grid collapses to a single stacked column (`grid-cols-1`) and
 * the height/stick/overflow classes are inert, so the natural flow is kept.
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
          'min-h-[200px] rounded-lg border border-gray-200 bg-white p-4 md:p-6 lg:col-span-7',
          'lg:sticky lg:top-[84px] lg:h-[calc(100dvh-104px)] lg:overflow-y-auto',
          !main && 'border-dashed border-gray-300 bg-gray-50/80',
        )}
      >
        {main ?? (
          <p className="type-b2-regular text-muted-foreground">{mainPlaceholder ?? ''}</p>
        )}
      </div>
      <div className="flex min-h-[200px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white p-4 md:p-6 lg:sticky lg:top-[84px] lg:col-span-3 lg:h-[calc(100dvh-104px)]">
        {aside ?? (
          <p className="type-b2-regular text-muted-foreground">{asidePlaceholder ?? ''}</p>
        )}
      </div>
    </section>
  )
}
