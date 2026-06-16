/**
 * Support module — aggregated landing-page payload (the ONE GET).
 *
 * The whole `/support` page renders from a single request. This orchestrator
 * fans out to the independent, reusable services under `./services` with
 * `Promise.all` and composes their results into a {@link SupportOverview}.
 *
 * Why one GET? It's the core performance principle of this module: the page
 * loads everything it needs in one round-trip; afterwards, mutations (POSTs)
 * invalidate the `support-overview` query so only what changed re-fetches.
 *
 * Adding a section? Write a small service in `./services`, then add one line to
 * the `Promise.all` below and one field to `SupportOverview`. Nothing else
 * changes.
 */

import type { SupportOverview } from '@/server/api/support/support.types'
import {
  getCategoriesForBatch,
  searchFaqs,
} from '@/server/api/support/services/faqs.service'
import {
  getBatchContact,
  getCoordinators,
  getSupportGate,
  getUserSupportBatches,
} from '@/server/api/support/services/directory.service'
import {
  getCallbackOptions,
  listCallbacks,
} from '@/server/api/support/services/callback.service'
import {
  countOpenTickets,
  listTickets,
} from '@/server/api/support/services/tickets.read.service'

/** How many FAQs to embed in the initial payload (before the user searches). */
const INITIAL_FAQ_LIMIT = 8

/**
 * Build the support landing payload for a student.
 *
 * @param userId          The signed-in student.
 * @param requestedBatchId Optional batch to scope to; defaults to the student's
 *                         first active batch.
 */
export async function getSupportOverview(
  userId: number,
  requestedBatchId?: number,
): Promise<SupportOverview> {
  // 1) Batches first — everything else is scoped to the active batch.
  const batches = await getUserSupportBatches(userId)

  // No batch → a minimal, safe payload (the UI shows an empty/onboarding state).
  if (batches.length === 0) {
    return {
      batches: [],
      gateReason: null,
      contact: { text: null, phone: null },
      categories: [],
      faqs: [],
      tickets: [],
      openTicketCount: 0,
      callback: { reasons: [], timeslots: [] },
      callbackTickets: [],
      coordinators: [],
    }
  }

  const activeBatch =
    batches.find((b) => b.id === requestedBatchId) ?? batches[0]
  const batchId = activeBatch.id

  // 2) Fan out every section in parallel.
  const [
    gateReason,
    contact,
    categories,
    faqs,
    tickets,
    openTicketCount,
    callback,
    callbackTickets,
    coordinators,
  ] = await Promise.all([
    getSupportGate({ userId, batchId }),
    getBatchContact(batchId),
    getCategoriesForBatch(batchId),
    searchFaqs({ batchId, limit: INITIAL_FAQ_LIMIT }),
    listTickets({ userId, tab: 'unresolved' }),
    countOpenTickets(userId),
    getCallbackOptions(),
    listCallbacks(userId),
    activeBatch.oneOnOneEnabled
      ? getCoordinators({ userId, batchId })
      : Promise.resolve([]),
  ])

  return {
    batches,
    gateReason,
    contact,
    categories,
    faqs,
    tickets,
    openTicketCount,
    callback,
    callbackTickets,
    coordinators,
  }
}
