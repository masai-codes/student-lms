'use client'

import { useState } from 'react'

import { ChevronRight, Link2 } from 'lucide-react'

import { AssociatedContentDrawer } from './AssociatedContentDrawer'
import { ASSOCIATED_CONTENT_DRAWER_TITLE } from './associatedContentLabels'
import { useViewportBottomInset } from './useViewportBottomInset'

import type { LearningItem } from '@/server/learn/types'
import { cn } from '@/lib/utils'
import { pushLearnEvent } from '@/components/features/learn/shared/learnAnalytics'
import { APP_MOBILE_TAB_BAR_SELECTOR } from '@/components/features/layout/AppMobileTabBar'

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
  // Default to reserving the fixed mobile tab bar so the drawer's scroll area
  // isn't hidden behind it; callers with taller fixed chrome (e.g. the
  // assignment sticky footer) pass their own selector, which already spans the
  // tab bar below it.
  const bottomInsetPx = useViewportBottomInset(
    reserveViewportBottomFrom ?? APP_MOBILE_TAB_BAR_SELECTOR,
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
          'dash-lift group flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 text-left shadow-sm transition-colors hover:border-brand/35 hover:bg-surface-muted',
          className,
        )}
        aria-label={`Open ${ASSOCIATED_CONTENT_DRAWER_TITLE}`}
      >
        <div className="flex min-w-0 items-center gap-3">
          {/* `brand-subtle` equals the old `primary-50` in light and re-themes in dark. */}
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-primary-600 transition-transform duration-200 group-hover:scale-110 dark:text-brand-subtle-foreground">
            <Link2 className="size-5" strokeWidth={2} aria-hidden />
          </span>
          <span className="type-b2-md text-foreground">
            {ASSOCIATED_CONTENT_DRAWER_TITLE}
          </span>
          <span className="type-t2 animate-dash-pop flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white dark:bg-brand dark:text-brand-foreground">
            {items.length}
          </span>
        </div>
        <ChevronRight
          className="size-5 shrink-0 text-foreground-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-brand"
          aria-hidden
        />
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
