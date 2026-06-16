import { CaretRight } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'

import type { TicketListItem } from '@/server/api/support/support.types'
import { Pressable } from '@/components/ui/pressable'
import { formatSocialPostTime } from '@/lib/socialRelativeTime'
import { cn } from '@/lib/utils'
import { TicketStatusBadge } from '@/components/features/support/TicketStatusBadge'

/**
 * TicketCard — one row in the ticket list / open-tickets strip.
 *
 * Tapping it routes to the conversation (`/support/$supportId`). An unread dot
 * marks tickets with a new coordinator reply. Built on {@link Pressable} for the
 * native press feel and on {@link Link} so it's a real, prefetchable navigation.
 */
export function TicketCard({ ticket }: { ticket: TicketListItem }) {
  return (
    <Pressable asChild className="block w-full rounded-2xl">
      <Link
        to="/support/$supportId"
        params={{ supportId: String(ticket.id) }}
        className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:shadow-sm"
      >
        {/* Unread indicator — a calm dot, not a loud badge. */}
        <span
          className={cn(
            'mt-1 size-2 shrink-0 rounded-full',
            ticket.hasUnread ? 'bg-primary' : 'bg-transparent',
          )}
          aria-hidden
        />

        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="truncate font-semibold leading-tight text-foreground">
            {ticket.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <TicketStatusBadge status={ticket.status} />
            <span className="capitalize">
              {ticket.category.replace(/[-_]/g, ' ')}
            </span>
            {ticket.updatedAt && (
              <>
                <span aria-hidden>·</span>
                <span>{formatSocialPostTime(ticket.updatedAt)}</span>
              </>
            )}
          </div>
        </div>

        <CaretRight className="size-4 shrink-0 text-muted-foreground" />
      </Link>
    </Pressable>
  )
}
