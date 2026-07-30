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
import { batches, comments, tickets, users } from '@/db/schema'
import {
  appendCreateTicketSectionInfo,
  getBatchDurationOfUser,
  resolveCreateTicketAssignment,
} from '@/server/api/support/services/createTicketAudit.service'
import { getActiveSectionNames } from '@/server/api/support/services/directory.service'
import {
  currentLevel,
  hasHigherLevel,
  ladderFromBatchSettings,
  nextEscalation,
} from '@/server/api/support/services/resolveAssignees'
import {
  patchEscalationAudit,
  patchReopenAudit,
} from '@/server/api/support/services/ticketInfo.service'
import { resolveTicketTitle } from '@/server/api/support/services/generateTicketTitle.service'
import { fetchEntityTitleForTicket } from '@/server/api/support/services/fetchEntityTitleForTicket.service'
import { buildFirstTemplateResponse } from '@/server/api/support/services/ticketReplyTemplate'
import { normalizeStatus } from '@/server/api/support/services/serialize'
import { supportNow } from '@/server/api/support/services/supportTime'
import { getTicketCapabilities } from '@/server/api/support/ticketCapabilities'

/** Load a ticket the student owns, or throw `*_NOT_FOUND`. */
async function loadOwnedTicket(userId: number, ticketId: number) {
  const rows = await db
    .select()
    .from(tickets)
    .where(and(eq(tickets.id, ticketId), eq(tickets.userId, userId)))
  if (rows.length === 0) throw new Error('SUPPORT_TICKET_NOT_FOUND')
  return rows[0]
}

/**
 * Raise a new ticket.
 *
 * Stores `batch_id`, `subCategory`, the originating FAQ (`question_id`) and —
 * for tickets raised from a lecture / assignment / resource detail page — the
 * originating entity (`entity_id`) in `tickets.data`, sets `status='open'`, and
 * auto-assigns the L1 owner. The title is derived from category + subcategory
 * (the legacy system auto-titles too).
 *
 * The `data` keys mirror the legacy web payload exactly — see the comment on
 * the insert below.
 *
 * `created_at` / `updated_at` are written explicitly: the columns are
 * `TIMESTAMP(0) NULL` with **no DB default**, so omitting them stores NULL.
 * wall-clock; {@link supportNow} matches that.
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
  /** Lecture / assignment / resource the ticket was raised from, if any. */
  entityId?: number | null
  /** When true, records in `info.log` that the ticket came from the support floater. */
  fromFloater?: boolean
}): Promise<{ id: number }> {
  if (!input.message.trim()) throw new Error('SUPPORT_MESSAGE_REQUIRED')

  const now = supportNow()

  const [activeSections, entityTitle, duration, assignment] = await Promise.all(
    [
      getActiveSectionNames(input.userId, input.batchId),
      input.entityId != null
        ? fetchEntityTitleForTicket({
            userId: input.userId,
            category: input.category,
            entityId: input.entityId,
          })
        : Promise.resolve(null),
      getBatchDurationOfUser(input.userId),
      resolveCreateTicketAssignment({
        batchId: input.batchId,
        category: input.category,
        questionId: input.questionId,
        timestamp: now,
      }),
    ],
  )

  const { assigneeId, info, logstamps } = assignment
  appendCreateTicketSectionInfo({ info, activeSections, duration })
  if (input.fromFloater) {
    info.log += 'Ticket raised from support floater.\n'
  }

  const { title, source: titleSource } = await resolveTicketTitle({
    message: input.message.trim(),
    category: input.category,
    subCategory: input.subCategory,
    entityTitle,
  })

  // `entity_id` — the key the web flow this replaces writes. The old LMS's
  // AssignmentCreateTicketModal (lecture / assignment detail → GraphQL
  // `createTicketV2`) puts `entity_id: lectureId || assignmentId` into `data`.
  // Note the REST `createTicketV2` (`ticket.controller.ts`, the mobile-app
  // path) stores the same value as `entity_ID` instead — a pre-existing
  // inconsistency in the legacy system. We follow the web spelling.
  const entityId =
    input.entityId != null &&
    Number.isFinite(input.entityId) &&
    input.entityId > 0
      ? Number(input.entityId)
      : null

  const [result] = await db.insert(tickets).values({
    userId: input.userId,
    title,
    message: input.message.trim(),
    category: input.category,
    status: 'open',
    assigneeId,
    rating: 0,
    isClosed: 0,
    // Key names and shapes are held identical to the legacy payload: the admin
    // ticket list filters on `$.subCategory` and `$.batch_id` (a *string*, per
    // `CreateTicketV2Input.batch_id: String!`), and `question_id` is only ever
    // present when the ticket came from a FAQ.
    info,
    data: {
      batch_id: String(input.batchId),
      subCategory: input.subCategory ?? '',
      help_faq_question: true,
      ...(input.questionId != null ? { question_id: input.questionId } : {}),
      ...(entityId !== null ? { entity_id: entityId } : {}),
      'active-sections': activeSections,
      workflow_id: `ticket-${randomUUID()}`,
      title_source: titleSource,
    },
    logstamps,
    createdAt: now,
    updatedAt: now,
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

  const now = supportNow()
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
    .set({ rating: input.rating, updatedAt: supportNow() })
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

  const now = supportNow()
  const audit = patchReopenAudit({
    info: ticket.info,
    logstamps: ticket.logstamps,
    meta: ticket.meta,
    now,
    status: normalizeStatus(ticket.status),
    assigneeId: ticket.assigneeId,
  })

  await db
    .update(tickets)
    .set({
      status: 're-opened',
      isClosed: 0,
      updatedAt: now,
      info: audit.info,
      logstamps: audit.logstamps,
      meta: audit.meta,
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

  const now = supportNow()
  const fromLevel = currentLevel(ladder, ticket.assigneeId) ?? 'l1'
  const [assigneeRow] = await db
    .select({ email: users.email, id: users.id, name: users.name })
    .from(users)
    .where(eq(users.id, next.userId))
    .limit(1)
  const nextAssigneeLabel = assigneeRow
    ? `${assigneeRow.email} (${assigneeRow.id}) - ${assigneeRow.name}`
    : null
  const audit = patchEscalationAudit({
    info: ticket.info,
    logstamps: ticket.logstamps,
    meta: ticket.meta,
    now,
    fromLevel,
    toLevel: next.level,
    currentAssigneeId: ticket.assigneeId,
    nextAssigneeId: next.userId,
    nextAssigneeLabel,
  })

  await db
    .update(tickets)
    .set({
      assigneeId: next.userId,
      status: 're-opened',
      isClosed: 0,
      updatedAt: now,
      info: audit.info,
      logstamps: audit.logstamps,
      meta: audit.meta,
    })
    .where(eq(tickets.id, input.ticketId))

  return { status: 're-opened', level: next.level }
}
