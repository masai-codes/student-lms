import { createFileRoute } from '@tanstack/react-router'

import { TicketConversation } from '@/components/features/support'

/**
 * `/support/$supportId` — a single ticket's conversation.
 *
 * Thin route: parses the id and renders {@link TicketConversation}, which loads
 * the whole thread from one GET (`/api/support/tickets/thread`) and wires reply /
 * rate / reopen / escalate through mutations that invalidate the thread + the
 * overview.
 */
export const Route = createFileRoute('/(protected)/_layout/support/$supportId/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { supportId } = Route.useParams()
  return (
    <div className="mx-auto h-[calc(100dvh-8rem)] w-full max-w-3xl">
      <TicketConversation ticketId={Number(supportId)} />
    </div>
  )
}
