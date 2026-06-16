/**
 * Support module — ticket read services.
 *
 * Pure reads over `tickets` + `comments` (+ `users` for authors). Three concerns:
 *   1. {@link listTickets}     — the student's tickets for a tab (newest first).
 *   2. {@link countOpenTickets} — header badge count.
 *   3. {@link getTicketThread} — full conversation for one ticket (+ capabilities).
 *
 * The student only ever sees their **own** tickets and only **public** comments;
 * both are enforced in the WHERE clauses here, not in the UI.
 */

import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'
import type {
  TicketDetail,
  TicketListItem,
  TicketMessage,
  TicketTab,
  TicketThread,
} from '@/server/api/support/support.types'
import { db } from '@/db'
import { batches, comments, tickets, users } from '@/db/schema'
import { getTicketCapabilities } from '@/server/api/support/ticketCapabilities'
import { hasHigherLevel } from '@/server/api/support/services/resolveAssignees'
import {
  messageSide,
  normalizeStatus,
  toPerson,
} from '@/server/api/support/services/serialize'

const PAGE_SIZE = 10

/** Statuses considered "resolved" for the Resolved tab. */
const RESOLVED_STATUSES = ['resolved', 'closed', 'automatic']
/** Statuses considered "unresolved" for the default tab. */
const UNRESOLVED_STATUSES = ['open', 're-opened']

/** Rows per page in the Raised Tickets list. */
export const TICKETS_PAGE_SIZE = PAGE_SIZE

/** WHERE conditions for a tab (shared by list + count). */
function tabConditions(userId: number, tab: TicketTab) {
  const conditions = [eq(tickets.userId, userId)]
  if (tab === 'unresolved') conditions.push(inArray(tickets.status, UNRESOLVED_STATUSES))
  if (tab === 'resolved') conditions.push(inArray(tickets.status, RESOLVED_STATUSES))
  return conditions
}

/** Total tickets for a tab (for pagination). */
export async function countTickets(userId: number, tab: TicketTab): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(tickets)
    .where(and(...tabConditions(userId, tab)))
  return Number(row.count)
}

/**
 * List a student's tickets for a given tab, newest-updated first.
 *
 * `hasUnread` is derived: the newest comment is from someone other than the
 * student and is public. (A richer per-user read-state can replace this later
 * without changing the shape.)
 */
export async function listTickets(input: {
  userId: number
  tab?: TicketTab
  page?: number
}): Promise<Array<TicketListItem>> {
  const tab = input.tab ?? 'unresolved'
  const page = input.page ?? 1

  const conditions = tabConditions(input.userId, tab)

  const rows = await db
    .select({
      id: tickets.id,
      title: tickets.title,
      category: tickets.category,
      status: tickets.status,
      rating: tickets.rating,
      updatedAt: tickets.updatedAt,
    })
    .from(tickets)
    .where(and(...conditions))
    .orderBy(desc(tickets.updatedAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE)

  if (rows.length === 0) return []

  // One extra query for unread state: the latest public comment per ticket.
  const ticketIds = rows.map((r) => r.id)
  const latestComments = await db
    .select({
      ticketId: comments.ticketId,
      userId: comments.userId,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .where(and(inArray(comments.ticketId, ticketIds), eq(comments.public, 1)))
    .orderBy(desc(comments.createdAt))

  const latestByTicket = new Map<number, { userId: number }>()
  for (const c of latestComments) {
    if (!latestByTicket.has(c.ticketId)) latestByTicket.set(c.ticketId, c)
  }

  return rows.map((r) => {
    const latest = latestByTicket.get(r.id)
    return {
      id: r.id,
      title: r.title,
      category: r.category,
      status: normalizeStatus(r.status),
      rating: r.rating,
      updatedAt: r.updatedAt,
      hasUnread: latest ? latest.userId !== input.userId : false,
    }
  })
}

/** Count a student's not-yet-resolved tickets (drives the header badge). */
export async function countOpenTickets(userId: number): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(tickets)
    .where(
      and(
        eq(tickets.userId, userId),
        inArray(tickets.status, UNRESOLVED_STATUSES),
      ),
    )
  // count(*) always returns exactly one row.
  return Number(rows[0].count)
}

/**
 * Build the full conversation payload for one ticket in a single call:
 * header + status banner + public messages + capabilities.
 *
 * Ownership is enforced: a ticket not owned by `userId` throws `*_NOT_FOUND`
 * (we don't leak existence). Capabilities are computed here so the client never
 * re-derives the rules.
 */
export async function getTicketThread(input: {
  userId: number
  ticketId: number
}): Promise<TicketThread> {
  const rows = await db
    .select({
      id: tickets.id,
      title: tickets.title,
      message: tickets.message,
      category: tickets.category,
      status: tickets.status,
      rating: tickets.rating,
      data: tickets.data,
      createdAt: tickets.createdAt,
      assigneeId: tickets.assigneeId,
      ownerId: tickets.userId,
      ownerName: users.name,
      ownerPhoto: users.profilePhotoPath,
    })
    .from(tickets)
    .innerJoin(users, eq(users.id, tickets.userId))
    .where(and(eq(tickets.id, input.ticketId), eq(tickets.userId, input.userId)))

  if (rows.length === 0) throw new Error('SUPPORT_TICKET_NOT_FOUND')
  const row = rows[0]

  const status = normalizeStatus(row.status)
  const batchId = row.data?.batch_id ? Number(row.data.batch_id) : null
  const subCategory = (row.data?.subCategory as string | undefined) ?? null

  // Resolve escalation availability from the ticket's batch settings.
  let canEscalate = false
  if (batchId) {
    const batchRows = await db
      .select({ settings: batches.settings })
      .from(batches)
      .where(eq(batches.id, batchId))
    canEscalate =
      batchRows.length > 0
        ? hasHigherLevel(batchRows[0].settings, row.category, row.assigneeId)
        : false
  }

  const capabilities = getTicketCapabilities(status, row.rating, canEscalate)

  // Public comments, oldest → newest, with their authors.
  const messageRows = await db
    .select({
      id: comments.id,
      message: comments.message,
      createdAt: comments.createdAt,
      authorId: comments.userId,
      authorName: users.name,
      authorRole: users.role,
      authorPhoto: users.profilePhotoPath,
      authorMeta: users.meta,
    })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.userId))
    .where(and(eq(comments.ticketId, input.ticketId), eq(comments.public, 1)))
    .orderBy(asc(comments.createdAt))

  const messages: Array<TicketMessage> = messageRows.map((m) => ({
    id: m.id,
    message: m.message,
    createdAt: m.createdAt,
    side: messageSide(m.authorId, input.userId),
    author: toPerson({
      id: m.authorId,
      name: m.authorName,
      role: m.authorRole,
      profilePhotoPath: m.authorPhoto,
    }),
  }))

  const ticket: TicketDetail = {
    id: row.id,
    title: row.title,
    message: row.message,
    category: row.category,
    subCategory,
    status,
    rating: row.rating,
    tatHours: typeof row.data?.categoryTat === 'number' ? row.data.categoryTat : null,
    createdAt: row.createdAt,
    batchId,
    owner: toPerson({ id: row.ownerId, name: row.ownerName, profilePhotoPath: row.ownerPhoto }),
  }

  return {
    ticket,
    statusResponse: buildStatusResponse(status, ticket.tatHours),
    messages,
    capabilities,
  }
}

/** The status banner copy shown at the top of a conversation. */
function buildStatusResponse(
  status: ReturnType<typeof normalizeStatus>,
  tatHours: number | null,
): TicketThread['statusResponse'] {
  switch (status) {
    case 'open':
    case 're-opened':
      return {
        heading: 'We’re on it',
        message: tatHours
          ? `A coordinator usually replies within ${tatHours} hours.`
          : 'A coordinator will reply here soon.',
      }
    case 'resolved':
      return {
        heading: 'Marked as resolved',
        message: 'If this didn’t fully solve it, you can reopen or escalate below.',
      }
    case 'closed':
      return { heading: 'Ticket closed', message: 'Need more help? Reopen or escalate below.' }
    case 'automatic':
      return {
        heading: 'Resolved automatically',
        message: 'This was answered automatically. Reopen if you still need help.',
      }
    default:
      return null
  }
}
