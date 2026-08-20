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
  FloatingChatInbox,
  LectureSupportSnapshot,
  SupportEntityContext,
  TicketRating,
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

/** GET the floating support modal inbox payload. */
export async function fetchFloatingChatInbox(): Promise<FloatingChatInbox> {
  return fetchJson<FloatingChatInbox>(SUPPORT_API.floatingChatInbox)
}

/** GET batch + item card for launching the floater from a learn detail page. */
export async function fetchSupportEntityContext(input: {
  category: string
  entityId: number
}): Promise<SupportEntityContext> {
  return fetchJson<SupportEntityContext>(
    SUPPORT_API.floatingChatEntityContext(input.category, input.entityId),
  )
}

/** GET lecture recording / duration / AI summary / attendance for support modal. */
export async function fetchLectureSupportSnapshot(
  lectureId: number,
): Promise<LectureSupportSnapshot> {
  return fetchJson<LectureSupportSnapshot>(
    SUPPORT_API.floatingChatLectureSnapshot(lectureId),
  )
}

/** GET assignment/evaluation type, status, and score for support modal. */
export async function fetchAssignmentSupportSnapshot(
  assignmentId: number,
): Promise<AssignmentSupportSnapshot> {
  return fetchJson<AssignmentSupportSnapshot>(
    SUPPORT_API.floatingChatAssignmentSnapshot(assignmentId),
  )
}

/** GET the subcategories for a single (context) category — e.g. "lecture". */
export async function fetchSubcategoriesByCategory(
  category: string,
): Promise<{ subcategories: Array<{ value: string; label: string }> }> {
  return fetchJson(
    `${SUPPORT_API.subcategories}?category=${encodeURIComponent(category)}`,
  )
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
  /** Lecture / assignment / resource id when raised from a detail page. */
  entityId?: number | null
  /** When true, the server records floater origin in `tickets.info.log`. */
  fromFloater?: boolean
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
  /** Pill reasons from the post-resolve feedback form. */
  reasons?: string[]
  /** Free-text comment from the feedback form. */
  comment?: string
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
