/**
 * Support module — ticket write services (mutations).
 *
 *   1. {@link createTicket} — raise a new ticket (auto-assigns the L1 owner).
 *   2. {@link addReply}     — student adds a public comment.
 *   3. {@link rateTicket}   — 👍 / 👎 on a resolved ticket.
 *   4. {@link reopenTicket} — reopen after a 👎.
 *   5. {@link escalateTicket} — move up the L1→L5 ladder.
 *
 * Every mutation **re-verifies ownership and the capability** server-side — the
 * client's `TicketCapabilities` is for UX only; the rules are enforced here too.
 * All routing/escalation logic is delegated to `resolveAssignees.ts`.
 */

import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import type { TicketRating } from '@/server/api/support/support.types'
import { db } from '@/db'
import { batches, comments, tickets } from '@/db/schema'
import { getActiveSectionNames } from '@/server/api/support/services/directory.service'
import {
  hasHigherLevel,
  ladderFromBatchSettings,
  nextEscalation,
} from '@/server/api/support/services/resolveAssignees'
import {
  resolveTicketTitle,
} from '@/server/api/support/services/generateTicketTitle.service'
import { fetchEntityTitleForTicket } from '@/server/api/support/services/fetchEntityTitleForTicket.service'
import { buildFirstTemplateResponse } from '@/server/api/support/services/ticketReplyTemplate'
import { normalizeStatus } from '@/server/api/support/services/serialize'
import { getTicketCapabilities } from '@/server/api/support/ticketCapabilities'

/**
 * Fallback assignee when a batch has no escalation ladder configured. The
 * `tickets.assignee_id` column is NOT NULL, so a ticket must always have an
 * owner; ops can reassign from the admin tools. Override via env if needed.
 */
const FALLBACK_ASSIGNEE_ID = Number(
  process.env.SUPPORT_FALLBACK_ASSIGNEE_ID ?? 1,
)

/** Load a ticket the student owns, or throw `*_NOT_FOUND`. */
async function loadOwnedTicket(userId: number, ticketId: number) {
  const rows = await db
    .select()
    .from(tickets)
    .where(and(eq(tickets.id, ticketId), eq(tickets.userId, userId)))
  if (rows.length === 0) throw new Error('SUPPORT_TICKET_NOT_FOUND')
  return rows[0]
}

/** Resolve the starting (L1) owner for a new ticket from its batch settings. */
async function resolveInitialAssignee(
  batchId: number | null,
  category: string,
): Promise<number> {
  if (!batchId) return FALLBACK_ASSIGNEE_ID
  const batchRows = await db
    .select({ settings: batches.settings })
    .from(batches)
    .where(eq(batches.id, batchId))
  if (batchRows.length === 0) return FALLBACK_ASSIGNEE_ID
  const ladder = ladderFromBatchSettings(batchRows[0].settings, category)
  return ladder.l1 ?? FALLBACK_ASSIGNEE_ID
}

/**
 * Raise a new ticket.
 *
 * Stores `batch_id`, `entity_id` (the lecture/assignment/resource the student
 * was looking at, if any), `subCategory`, the originating FAQ (`question_id`),
 * a fresh `workflow_id`, and a snapshot of the student's `active-sections` in
 * `tickets.data`, sets `status='open'`, and auto-assigns the L1 owner. The title
 * is resolved by {@link resolveTicketTitle} (AI summary when configured, with
 * deterministic fallbacks).
 *
 * @returns the new ticket id (the client then navigates into its conversation).
 */
export async function createTicket(input: {
  userId: number
  batchId: number
  category: string
  subCategory?: string | null
  message: string
  questionId?: number | null
  entityId?: number | null
}): Promise<{ id: number }> {
  if (!input.message.trim()) throw new Error('SUPPORT_MESSAGE_REQUIRED')

  const [assigneeId, activeSections, entityTitle] = await Promise.all([
    resolveInitialAssignee(input.batchId, input.category),
    getActiveSectionNames(input.userId, input.batchId),
    input.entityId != null
      ? fetchEntityTitleForTicket({
          userId: input.userId,
          category: input.category,
          entityId: input.entityId,
        })
      : Promise.resolve(null),
  ])

  const { title, source: titleSource } = await resolveTicketTitle({
    message: input.message.trim(),
    category: input.category,
    subCategory: input.subCategory,
    entityTitle,
  })

  const [result] = await db.insert(tickets).values({
    userId: input.userId,
    title,
    message: input.message.trim(),
    category: input.category,
    status: 'open',
    assigneeId,
    rating: 0,
    isClosed: 0,
    data: {
      batch_id: String(input.batchId),
      entity_id: input.entityId != null ? String(input.entityId) : null,
      subCategory: input.subCategory ?? null,
      question_id: input.questionId ?? null,
      workflow_id: `ticket-${randomUUID()}`,
      'active-sections': activeSections,
      help_faq_question: true,
      title_source: titleSource,
    },
    logstamps: { L1_assigned_at: new Date().toISOString() },
  })

  const ticketId = Number(result.insertId)

  // Post the tailored first-template reply as a real coordinator comment, exactly
  // like the legacy flow. Best-effort: a failure here must not fail ticket
  // creation (the ticket already exists and is owned by an assignee).
  try {
    const { message, displayName } = await buildFirstTemplateResponse({
      batchId: input.batchId,
      category: input.category,
      assigneeId,
    })
    const now = new Date().toISOString()
    await db.insert(comments).values({
      ticketId,
      userId: assigneeId,
      message,
      public: 1,
      createdAt: now,
      updatedAt: now,
      data: {
        firstTemplateResponse: true,
        ticket_level: 'l1',
        displayName,
      },
    })
  } catch (error) {
    console.error(
      `[support] first-template reply failed for ticket ${ticketId}`,
      error,
    )
  }

  // TODO(workflow): kick off the background workflow (TAT, notifications) here.
  return { id: ticketId }
}

/**
 * Add a student reply (a public comment). Allowed only while the conversation
 * is live (open / re-opened) — re-checked here, not just in the UI.
 */
export async function addReply(input: {
  userId: number
  ticketId: number
  message: string
}): Promise<{ id: number }> {
  if (!input.message.trim()) throw new Error('SUPPORT_MESSAGE_REQUIRED')

  const ticket = await loadOwnedTicket(input.userId, input.ticketId)
  const caps = getTicketCapabilities(
    normalizeStatus(ticket.status),
    ticket.rating,
    false,
  )
  if (!caps.canReply) throw new Error('SUPPORT_REPLY_NOT_ALLOWED')

  const now = new Date().toISOString()
  const [result] = await db.insert(comments).values({
    ticketId: input.ticketId,
    userId: input.userId,
    message: input.message.trim(),
    public: 1,
    createdAt: now,
    updatedAt: now,
  })
  await db
    .update(tickets)
    .set({ updatedAt: now })
    .where(eq(tickets.id, input.ticketId))

  return { id: Number(result.insertId) }
}

/** Record a 👍 (5) / 👎 (1) rating on a resolved ticket. */
export async function rateTicket(input: {
  userId: number
  ticketId: number
  rating: TicketRating
}): Promise<{ rating: number }> {
  // Defensive runtime guard (handler already validates the 1|5 union).
  const ratingValue: number = input.rating
  if (ratingValue !== 1 && ratingValue !== 5)
    throw new Error('SUPPORT_INVALID_RATING')

  const ticket = await loadOwnedTicket(input.userId, input.ticketId)
  const caps = getTicketCapabilities(
    normalizeStatus(ticket.status),
    ticket.rating,
    false,
  )
  if (!caps.canRate) throw new Error('SUPPORT_RATE_NOT_ALLOWED')

  await db
    .update(tickets)
    .set({ rating: input.rating, updatedAt: new Date().toISOString() })
    .where(eq(tickets.id, input.ticketId))

  return { rating: input.rating }
}

/** Reopen a resolved/closed ticket (only valid after a 👎). */
export async function reopenTicket(input: {
  userId: number
  ticketId: number
}): Promise<{ status: 're-opened' }> {
  const ticket = await loadOwnedTicket(input.userId, input.ticketId)
  const caps = getTicketCapabilities(
    normalizeStatus(ticket.status),
    ticket.rating,
    false,
  )
  if (!caps.canReopen) throw new Error('SUPPORT_REOPEN_NOT_ALLOWED')

  const now = new Date().toISOString()
  const logstamps = ticket.logstamps ?? {}

  await db
    .update(tickets)
    .set({
      status: 're-opened',
      isClosed: 0,
      updatedAt: now,
      logstamps: { ...logstamps, reopened_at: now },
    })
    .where(eq(tickets.id, input.ticketId))

  return { status: 're-opened' }
}

/**
 * Escalate a ticket to the next level up its batch's ladder.
 *
 * Re-checks that a higher level exists, moves `assignee_id`, flips status to
 * `re-opened`, and records the escalation in `meta` + `logstamps`.
 */
export async function escalateTicket(input: {
  userId: number
  ticketId: number
}): Promise<{ status: 're-opened'; level: string }> {
  const ticket = await loadOwnedTicket(input.userId, input.ticketId)
  const batchId = ticket.data?.batch_id ? Number(ticket.data.batch_id) : null

  const [batchRow] = batchId
    ? await db
        .select({ settings: batches.settings })
        .from(batches)
        .where(eq(batches.id, batchId))
    : [undefined]

  const canEscalate = hasHigherLevel(
    batchRow?.settings,
    ticket.category,
    ticket.assigneeId,
  )
  const caps = getTicketCapabilities(
    normalizeStatus(ticket.status),
    ticket.rating,
    canEscalate,
  )
  if (!caps.canEscalate) throw new Error('SUPPORT_ESCALATE_NOT_ALLOWED')

  const ladder = ladderFromBatchSettings(batchRow?.settings, ticket.category)
  const next = nextEscalation(ladder, ticket.assigneeId)
  if (!next) throw new Error('SUPPORT_ESCALATE_NOT_ALLOWED')

  const now = new Date().toISOString()
  const meta = ticket.meta ?? {}
  const logstamps = ticket.logstamps ?? {}

  await db
    .update(tickets)
    .set({
      assigneeId: next.userId,
      status: 're-opened',
      isClosed: 0,
      updatedAt: now,
      meta: { ...meta, escalation_count: (meta.escalation_count ?? 0) + 1 },
      logstamps: {
        ...logstamps,
        reopened_at: now,
        [`escalated_to_${next.level}_at`]: now,
      },
    })
    .where(eq(tickets.id, input.ticketId))

  return { status: 're-opened', level: next.level }
}
