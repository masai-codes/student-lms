/**
 * Floating support modal — inbox payload.
 *
 * Batches, ticket inbox, callback history, callback options, and open-ticket
 * count in one GET. Called once when the user opens the floater; the client
 * caches until reload.
 */

import type { FloatingChatInbox } from '@/server/api/support/support.types'
import {
  getCallbackAdmissionFlags,
  getCallbackOptions,
  listCallbacks,
} from '@/server/api/support/services/callback.service'
import {
  getBatchContact,
  getOneOnOneGroups,
  getUserSupportBatches,
} from '@/server/api/support/services/directory.service'
import {
  countOpenTickets,
  listTickets,
} from '@/server/api/support/services/tickets.read.service'

/** Max tickets embedded in the inbox payload (no pagination in the modal). */
const INBOX_TICKET_LIMIT = 100

export async function getFloatingChatInbox(userId: number): Promise<FloatingChatInbox> {
  const batches = await getUserSupportBatches(userId)

  const [tickets, callbackTickets, openTicketCount, callback, admissionFlags, oneOnOne, ...contacts] =
    await Promise.all([
      listTickets({ userId, tab: 'all', page: 1, limit: INBOX_TICKET_LIMIT }),
      listCallbacks(userId),
      countOpenTickets(userId),
      getCallbackOptions(),
      getCallbackAdmissionFlags(userId),
      getOneOnOneGroups(userId),
      ...batches.map((b) => getBatchContact(b.id)),
    ])

  const batchContacts: FloatingChatInbox['batchContacts'] = {}
  batches.forEach((batch, index) => {
    batchContacts[batch.id] = contacts[index] ?? { text: null, phone: null }
  })

  return {
    batches,
    tickets,
    callbackTickets,
    openTicketCount,
    callback,
    isNewUserJourney: admissionFlags.isNewUserJourney,
    fullFeesPaidBatchIds: admissionFlags.fullFeesPaidBatchIds,
    batchContacts,
    oneOnOne,
  }
}
