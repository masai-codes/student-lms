import { Info } from '@phosphor-icons/react'

import type { TicketStatusResponse } from '@/server/api/support/support.types'

/**
 * StatusCard — the system status banner pinned at the top of a conversation.
 *
 * Sets expectations ("usually answered in Nh") and tells the student what they
 * can do next, reflecting the ticket's current status. Copy comes from the
 * server (`buildStatusResponse`) so it stays in sync with the status machine.
 */
export function StatusCard({ data }: { data: TicketStatusResponse }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-3.5">
      <Info className="mt-0.5 size-4 shrink-0 text-primary" weight="fill" />
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-foreground">{data.heading}</p>
        <p className="text-sm text-muted-foreground">{data.message}</p>
      </div>
    </div>
  )
}
