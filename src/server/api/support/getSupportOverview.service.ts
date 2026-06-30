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
  getTicketCategories,
  searchFaqs,
} from '@/server/api/support/services/faqs.service'
import {
  getBatchContact,
  getOneOnOneGroups,
  getSupportGate,
  getUserSupportBatches,
} from '@/server/api/support/services/directory.service'
import {
  getCallbackEligibility,
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
      isNewUserJourney: false,
      hasFullFees: false,
      callback: { reasons: [], timeslots: [] },
      callbackTickets: [],
      oneOnOne: [],
    }
  }

  const activeBatch =
    batches.find((b) => b.id === requestedBatchId) ?? batches[0]
  const batchId = activeBatch.id

  // 2) Fan out every (non-batch) section in parallel, each ISOLATED: a failure
  //    in one (e.g. agreements, 1:1, callbacks) must not blank out the whole
  //    page — most importantly it must never wipe the batch list. Each falls
  //    back to a safe empty value and logs.
  const safe = async <T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await fn()
    } catch (error) {
      console.error(`[support] overview section "${label}" failed`, error)
      return fallback
    }
  }

  const [
    gateReason,
    contact,
    categories,
    faqs,
    tickets,
    openTicketCount,
    callback,
    callbackTickets,
    oneOnOne,
    eligibility,
  ] = await Promise.all([
    safe('gate', () => getSupportGate({ userId, batchId }), null),
    safe('contact', () => getBatchContact(batchId), { text: null, phone: null }),
    safe('categories', () => getTicketCategories(), []),
    safe('faqs', () => searchFaqs({ batchId, limit: INITIAL_FAQ_LIMIT }), []),
    safe('tickets', () => listTickets({ userId, tab: 'unresolved' }), []),
    safe('openTicketCount', () => countOpenTickets(userId), 0),
    safe('callbackOptions', () => getCallbackOptions(), { reasons: [], timeslots: [] }),
    safe('callbackTickets', () => listCallbacks(userId), []),
    safe('oneOnOne', () => getOneOnOneGroups(userId), []),
    safe('eligibility', () => getCallbackEligibility({ userId, batchId }), {
      isNewUserJourney: false,
      hasFullFees: false,
    }),
  ])

  return {
    batches,
    gateReason,
    contact,
    categories,
    faqs,
    tickets,
    openTicketCount,
    isNewUserJourney: eligibility.isNewUserJourney,
    hasFullFees: eligibility.hasFullFees,
    callback,
    callbackTickets,
    oneOnOne,
  }
}
