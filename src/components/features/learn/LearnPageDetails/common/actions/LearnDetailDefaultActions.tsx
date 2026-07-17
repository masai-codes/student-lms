'use client'

import { useState } from 'react'
import { Bookmark } from 'lucide-react'

import { MasaiButton } from '@/components/ui/masai-button'
import { RaiseTicketDrawer } from '@/components/features/support/RaiseTicketDrawer'
import { pushLearnEvent } from '@/components/features/learn/shared/learnAnalytics'

export interface LearnDetailBookmarkControls {
  isBookmarked: boolean
  pending: boolean
  toggle: () => void
}

type LearnDetailDefaultActionsProps = {
  /** When provided, renders a wired bookmark toggle; otherwise the button is inert. */
  bookmark?: LearnDetailBookmarkControls
  /** Page context category that scopes the Raise Ticket subcategory list. */
  ticketCategory?: string
}

/** Default CTAs for lecture / assignment / resource detail headers. */
export function LearnDetailDefaultActions({
  bookmark,
  ticketCategory,
}: LearnDetailDefaultActionsProps = {}) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <MasaiButton
        type="secondary"
        size="md"
        ctaText="Raise Ticket"
        htmlType="button"
        className="transition-all duration-200 active:scale-95"
        onClick={() => {
          pushLearnEvent('l_learn_raise_ticket_open', {
            category: ticketCategory,
          })
          setDrawerOpen(true)
        }}
      />
      <MasaiButton
        type="tertiary"
        size="md"
        icon={
          // Remounting on toggle replays the springy star pop each time.
          <Bookmark
            key={bookmark?.isBookmarked ? 'bookmarked' : 'unbookmarked'}
            strokeWidth={1.75}
            className={
              bookmark?.isBookmarked
                ? 'animate-masaiverse-star-pop size-5'
                : 'size-5'
            }
            fill={bookmark?.isBookmarked ? 'currentColor' : 'none'}
          />
        }
        iconOnly
        htmlType="button"
        className="transition-all duration-200 hover:scale-105 active:scale-95"
        aria-label={bookmark?.isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
        aria-pressed={bookmark ? bookmark.isBookmarked : undefined}
        disabled={bookmark?.pending}
        onClick={bookmark ? bookmark.toggle : () => undefined}
      />
      <RaiseTicketDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        contextCategory={ticketCategory}
      />
    </>
  )
}
