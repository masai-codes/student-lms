'use client'

import { useState } from 'react'
import { Bookmark, CircleQuestionMark } from 'lucide-react'

import { MasaiButton } from '@/components/ui/masai-button'
import { useFloatingChatOptional } from '@/components/common/floating-chat/FloatingChatProvider'
import { pushLearnEvent } from '@/components/features/learn/shared/learnAnalytics'
import type { SupportEntityCategory } from '@/server/api/support/support.types'

export interface LearnDetailBookmarkControls {
  isBookmarked: boolean
  pending: boolean
  toggle: () => void
}

const SUPPORT_ENTITY_CATEGORIES = new Set<SupportEntityCategory>([
  'lecture',
  'assignment',
  'resource',
  'evaluation',
])

type LearnDetailDefaultActionsProps = {
  /** When provided, renders a wired bookmark toggle; otherwise the button is inert. */
  bookmark?: LearnDetailBookmarkControls
  /** Page context category that scopes the support floater launch. */
  ticketCategory?: SupportEntityCategory
  /** Learn entity id for opening the support floater on step 2.5. */
  entityId?: number
}

/** Default CTAs for lecture / assignment / resource detail headers. */
export function LearnDetailDefaultActions({
  bookmark,
  ticketCategory,
  entityId,
}: LearnDetailDefaultActionsProps = {}) {
  const floatingChat = useFloatingChatOptional()

  const hasEntityLaunch =
    entityId != null &&
    ticketCategory != null &&
    SUPPORT_ENTITY_CATEGORIES.has(ticketCategory)

  return (
    <>
      <MasaiButton
        type="tertiary"
        size="sm"
        ctaText="Raise Ticket"
        htmlType="button"
        data-testid="learn-detail-raise-ticket"
        className="transition-all duration-200 active:scale-95"
        icon={<CircleQuestionMark />}
        onClick={() => {
          pushLearnEvent('l_learn_raise_ticket_open', {
            category: ticketCategory,
            entityId,
          })
          if (!floatingChat) return
          if (hasEntityLaunch) {
            floatingChat.openWithEntity({
              category: ticketCategory,
              entityId,
            })
            return
          }
          floatingChat.open()
        }}
      />
      <MasaiButton
        type="secondary"
        size="sm"
        icon={
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
    </>
  )
}
