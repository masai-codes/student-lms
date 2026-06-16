import { CaretLeft } from '@phosphor-icons/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import type { TicketRating } from '@/server/api/support/support.types'
import { Skeleton } from '@/components/ui/skeleton'
import {
  escalateSupportTicket,
  rateSupportTicket,
  reopenSupportTicket,
  replyToTicket,
} from '@/lib/api/support/supportApi'
import { SUPPORT_KEYS, ticketThreadQuery } from '@/query/support/supportQueries'
import { MessageBubble } from '@/components/features/support/MessageBubble'
import { StatusCard } from '@/components/features/support/StatusCard'
import { TicketActionFooter } from '@/components/features/support/TicketActionFooter'
import { TicketStatusBadge } from '@/components/features/support/TicketStatusBadge'

/**
 * TicketConversation — the ticket detail screen (full-screen on mobile, the
 * right pane on desktop).
 *
 * Loads the whole thread in one GET (`ticketThreadQuery`) and wires every action
 * through a mutation that, on success, invalidates this thread **and** the
 * overview (so the home open-tickets strip + badge stay correct). The footer
 * decides which action to show from the server-computed `capabilities`.
 */
export function TicketConversation({ ticketId }: { ticketId: number }) {
  const queryClient = useQueryClient()
  const { data, isPending } = useQuery(ticketThreadQuery(ticketId))

  /** After any mutation, refresh the thread + the home overview. */
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: SUPPORT_KEYS.thread(ticketId) })
    void queryClient.invalidateQueries({ queryKey: ['support', 'overview'] })
  }

  const replyMutation = useMutation({
    mutationFn: (message: string) => replyToTicket({ ticketId, message }),
    onSuccess: refresh,
  })
  const rateMutation = useMutation({
    mutationFn: (rating: TicketRating) => rateSupportTicket({ ticketId, rating }),
    onSuccess: refresh,
  })
  const reopenMutation = useMutation({
    mutationFn: () => reopenSupportTicket(ticketId),
    onSuccess: refresh,
  })
  const escalateMutation = useMutation({
    mutationFn: () => escalateSupportTicket(ticketId),
    onSuccess: refresh,
  })

  if (isPending || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    )
  }

  const { ticket, statusResponse, messages, capabilities } = data

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <Link
          to="/support"
          aria-label="Back to support"
          className="flex size-9 items-center justify-center rounded-full hover:bg-muted"
        >
          <CaretLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold leading-tight">{ticket.title}</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TicketStatusBadge status={ticket.status} />
            <span className="capitalize">{ticket.category.replace(/[-_]/g, ' ')}</span>
          </div>
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1 space-y-4 overflow-y-auto py-4">
        {statusResponse && <StatusCard data={statusResponse} />}

        {/* The student's opening message, then the thread. */}
        <MessageBubble
          message={{
            id: 0,
            message: ticket.message,
            createdAt: ticket.createdAt,
            side: 'student',
            author: ticket.owner,
          }}
        />
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </div>

      {/* Status-aware action footer (sticky bottom on mobile) */}
      <div className="sticky bottom-0 border-t border-border bg-background pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <TicketActionFooter
          capabilities={capabilities}
          tatHours={ticket.tatHours}
          pending={{
            reply: replyMutation.isPending,
            rate: rateMutation.isPending,
            reopen: reopenMutation.isPending,
            escalate: escalateMutation.isPending,
          }}
          onReply={(message) => replyMutation.mutate(message)}
          onRate={(rating) => rateMutation.mutate(rating)}
          onReopen={() => reopenMutation.mutate()}
          onEscalate={() => escalateMutation.mutate()}
        />
      </div>
    </div>
  )
}
