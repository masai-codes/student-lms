/**
 * Floating support modal — inbox payload.
 *
 * Batches, ticket inbox, callback history, and open-ticket count in one GET.
 * Called once when the user opens the floater; the client caches until reload.
 */

import type { FloatingChatInbox } from '@/server/api/support/support.types'
import { listCallbacks } from '@/server/api/support/services/callback.service'
import { getUserSupportBatches } from '@/server/api/support/services/directory.service'
import {
  countOpenTickets,
  listTickets,
} from '@/server/api/support/services/tickets.read.service'

/** Max tickets embedded in the inbox payload (no pagination in the modal). */
const INBOX_TICKET_LIMIT = 100

export async function getFloatingChatInbox(userId: number): Promise<FloatingChatInbox> {
  const [batches, tickets, callbackTickets, openTicketCount] = await Promise.all([
    getUserSupportBatches(userId),
    listTickets({ userId, tab: 'all', page: 1, limit: INBOX_TICKET_LIMIT }),
    listCallbacks(userId),
    countOpenTickets(userId),
  ])

  return {
    batches,
    tickets,
    callbackTickets,
    openTicketCount,
  }
}
