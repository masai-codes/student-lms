/**
 * Support module — typed HTTP client.
 *
 * Thin, fully-typed wrappers over `fetchJson` for every support endpoint. These
 * are the ONLY way the React layer talks to the backend — components and query
 * options call these functions and never touch `fetch` or URLs directly.
 *
 * Reads return their payload; writes return the small result the server sends
 * and the caller then invalidates the relevant query (see `query/support`).
 * Mirrors `masaiverse-v2/masaiverseV2Api.ts`.
 */

import type {
  AssignmentSupportSnapshot,
  FaqVote,
  FloatingChatInbox,
  LectureSupportSnapshot,
  SupportFaq,
  SupportOverview,
  TicketListItem,
  TicketRating,
  TicketTab,
  TicketThread,
} from '@/server/api/support/support.types'
import { fetchJson } from '@/lib/api/fetchJson'
import { uploadFileViaPresignedPost } from '@/lib/api/uploads/presignedS3Upload'
import { SUPPORT_API } from '@/lib/api/support/supportPaths'

const jsonPost = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

/** GET the aggregated landing payload (optionally scoped to a batch). */
export async function fetchSupportOverview(
  batchId?: number,
): Promise<SupportOverview> {
  const qs = batchId ? `?batchId=${batchId}` : ''
  return fetchJson<SupportOverview>(`${SUPPORT_API.overview}${qs}`)
}

/** GET the floating support modal inbox payload. */
export async function fetchFloatingChatInbox(): Promise<FloatingChatInbox> {
  return fetchJson<FloatingChatInbox>(SUPPORT_API.floatingChatInbox)
}

/** GET lecture recording / duration / AI summary / attendance for support modal. */
export async function fetchLectureSupportSnapshot(
  lectureId: number,
): Promise<LectureSupportSnapshot> {
  return fetchJson<LectureSupportSnapshot>(SUPPORT_API.floatingChatLectureSnapshot(lectureId))
}

/** GET assignment/evaluation type, status, and score for support modal. */
export async function fetchAssignmentSupportSnapshot(
  assignmentId: number,
): Promise<AssignmentSupportSnapshot> {
  return fetchJson<AssignmentSupportSnapshot>(
    SUPPORT_API.floatingChatAssignmentSnapshot(assignmentId),
  )
}

/** GET a page of FAQs for a batch (live search). */
export async function fetchSupportFaqs(input: {
  batchId: number
  search?: string
  category?: string
  subCategory?: string
  limit?: number
}): Promise<{ faqs: Array<SupportFaq> }> {
  const params = new URLSearchParams({ batchId: String(input.batchId) })
  if (input.search) params.set('search', input.search)
  if (input.category) params.set('category', input.category)
  if (input.subCategory) params.set('subCategory', input.subCategory)
  if (input.limit) params.set('limit', String(input.limit))
  return fetchJson(`${SUPPORT_API.faqs}?${params.toString()}`)
}

/** GET the subcategories for a single (context) category — e.g. "lecture". */
export async function fetchSubcategoriesByCategory(
  category: string,
): Promise<{ subcategories: Array<{ value: string; label: string }> }> {
  return fetchJson(
    `${SUPPORT_API.subcategories}?category=${encodeURIComponent(category)}`,
  )
}

/** POST an FAQ vote; returns the new aggregate counts. */
export async function voteSupportFaq(input: {
  faqId: number
  vote: FaqVote
}): Promise<{ faqId: number; upvotes: number; downvotes: number }> {
  return fetchJson(SUPPORT_API.faqVote, jsonPost(input))
}

/** GET the student's tickets for a tab (with the total count for pagination). */
export async function fetchSupportTickets(input: {
  tab: TicketTab
  page?: number
}): Promise<{ tickets: Array<TicketListItem>; total: number }> {
  const params = new URLSearchParams({ tab: input.tab })
  if (input.page) params.set('page', String(input.page))
  return fetchJson(`${SUPPORT_API.tickets}?${params.toString()}`)
}

/** GET one ticket's full conversation (header + messages + capabilities). */
export async function fetchTicketThread(
  ticketId: number,
): Promise<TicketThread> {
  return fetchJson(`${SUPPORT_API.ticketThread}?ticketId=${ticketId}`)
}

/** POST a new ticket; returns its id (navigate into the conversation next). */
export async function createSupportTicket(input: {
  batchId: number
  category: string
  subCategory?: string | null
  message: string
  questionId?: number | null
  entityId?: number | null
}): Promise<{ id: number }> {
  return fetchJson(SUPPORT_API.ticketCreate, jsonPost(input))
}

/** POST a reply to a ticket. */
export async function replyToTicket(input: {
  ticketId: number
  message: string
}): Promise<{ id: number }> {
  return fetchJson(SUPPORT_API.ticketReply, jsonPost(input))
}

/** POST a rating (👍=5 / 👎=1) for a resolved ticket. */
export async function rateSupportTicket(input: {
  ticketId: number
  rating: TicketRating
}): Promise<{ rating: number }> {
  return fetchJson(SUPPORT_API.ticketRate, jsonPost(input))
}

/** POST to reopen a ticket. */
export async function reopenSupportTicket(
  ticketId: number,
): Promise<{ status: 're-opened' }> {
  return fetchJson(SUPPORT_API.ticketReopen, jsonPost({ ticketId }))
}

/** POST to escalate a ticket up the ladder. */
export async function escalateSupportTicket(
  ticketId: number,
): Promise<{ status: 're-opened'; level: string }> {
  return fetchJson(SUPPORT_API.ticketEscalate, jsonPost({ ticketId }))
}

/** POST a callback request. */
export async function createSupportCallback(input: {
  batchId: number
  category: string
  preferredTimeSlot?: string | null
}): Promise<{ id: number }> {
  return fetchJson(SUPPORT_API.callbackCreate, jsonPost(input))
}

/** Upload one ticket attachment via presigned POST; returns its public URL + name. */
export async function uploadSupportAttachment(
  file: File,
): Promise<{ url: string; name: string }> {
  return uploadFileViaPresignedPost(file, { scope: 'tickets' })
}
