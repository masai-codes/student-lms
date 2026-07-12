'use client'

import { useState } from 'react'

import { ChevronRight, Link2 } from 'lucide-react'

import { AssociatedContentDrawer } from './AssociatedContentDrawer'
import { ASSOCIATED_CONTENT_DRAWER_TITLE } from './associatedContentLabels'
import { useViewportBottomInset } from './useViewportBottomInset'

import type { LearningItem } from '@/server/learn/types'
import { cn } from '@/lib/utils'
import { pushLearnEvent } from '@/components/features/learn/shared/learnAnalytics'

type AssociatedContentEntryCtaProps = {
  items: Array<LearningItem>
  className?: string
  /**
   * When set, measures this element while the drawer is open and lifts the panel
   * above fixed bottom chrome (e.g. assignment sticky footer).
   */
  reserveViewportBottomFrom?: string
}

export function AssociatedContentEntryCta({
  items,
  className,
  reserveViewportBottomFrom,
}: AssociatedContentEntryCtaProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const bottomInsetPx = useViewportBottomInset(
    reserveViewportBottomFrom,
    drawerOpen,
  )

  if (items.length === 0) return null

  return (
    <>
      <button
        type="button"
        onClick={() => {
          pushLearnEvent('l_learn_associated_drawer_open', {
            item_count: items.length,
          })
          setDrawerOpen(true)
        }}
        className={cn(
          'flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-colors hover:bg-gray-50',
          className,
        )}
        aria-label={`Open ${ASSOCIATED_CONTENT_DRAWER_TITLE}`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <Link2 className="size-5" strokeWidth={2} aria-hidden />
          </span>
          <span className="type-b2-md text-gray-900">
            {ASSOCIATED_CONTENT_DRAWER_TITLE}
          </span>
          <span className="type-t2 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white">
            {items.length}
          </span>
        </div>
        <ChevronRight className="size-5 shrink-0 text-gray-500" aria-hidden />
      </button>

      <AssociatedContentDrawer
        isOpen={drawerOpen}
        onOpenChange={setDrawerOpen}
        items={items}
        bottomInsetPx={bottomInsetPx}
      />
    </>
  )
}
