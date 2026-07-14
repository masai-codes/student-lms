/**
 * Support module — "request a callback" services.
 *
 *   1. {@link getCallbackOptions} — reason + time-slot choices (from `menus`).
 *   2. {@link createCallback}     — record a pending callback (one per batch).
 *
 * Options live in the shared `menus` table under two category keys (the same
 * keys the legacy system uses), so ops can edit them without a deploy.
 */

import { and, asc, desc, eq, sql } from 'drizzle-orm'
import type {
  CallbackOption,
  CallbackTicketItem,
} from '@/server/api/support/support.types'
import { db } from '@/db'
import { menus, userCallbackTickets } from '@/db/schema'

/** Coerce a `db.execute` result into a flat array of rows (driver-agnostic). */
function rowsOf<T>(result: unknown): Array<T> {
  if (Array.isArray(result)) {
    return Array.isArray(result[0])
      ? (result[0] as Array<T>)
      : (result as Array<T>)
  }
  if (result && typeof result === 'object' && 'rows' in result) {
    const { rows } = result
    if (Array.isArray(rows)) return rows as Array<T>
  }
  return []
}

/**
 * Callback eligibility — mirrors the legacy gate for the "Request a Callback"
 * CTA, which only shows for students on the **new user journey** (i.e. with a
 * `user_batch_admission_data` row). The same table's `full_fees_paid` drives
 * whether the "Student-Kit" reason is offered (legacy `hasFullFees`).
 *
 * @returns `isNewUserJourney` (any admission row for the user) and `hasFullFees`
 *          (admission row for the active batch with `full_fees_paid` set).
 */
export async function getCallbackEligibility(input: {
  userId: number
  batchId: number
}): Promise<{ isNewUserJourney: boolean; hasFullFees: boolean }> {
  const result = await db.execute(sql`
    SELECT batch_id, full_fees_paid
    FROM user_batch_admission_data
    WHERE user_id = ${input.userId}
  `)
  const rows = rowsOf<{ batch_id: number; full_fees_paid: number | boolean }>(
    result,
  )

  const isNewUserJourney = rows.length > 0
  const hasFullFees = rows.some(
    (r) => Number(r.batch_id) === input.batchId && Boolean(r.full_fees_paid),
  )
  return { isNewUserJourney, hasFullFees }
}

/** `menus.category` value holding callback *reasons*. */
const REASON_CATEGORY = 'call-backrequest-reason'
/** `menus.category` value holding callback *time slots*. */
const TIMESLOT_CATEGORY = 'call-backrequest-timeslot'

async function readMenu(category: string): Promise<Array<CallbackOption>> {
  const rows = await db
    .select({ id: menus.id, value: menus.value, ordering: menus.ordering })
    .from(menus)
    .where(and(eq(menus.category, category), eq(menus.deprecated, 0)))
    .orderBy(asc(menus.ordering))
  return rows.map((r) => ({ id: r.id, value: r.value, ordering: r.ordering }))
}

/** List the callback requests a student has raised (newest first). */
export async function listCallbacks(
  userId: number,
): Promise<Array<CallbackTicketItem>> {
  const rows = await db
    .select({
      id: userCallbackTickets.id,
      category: userCallbackTickets.category,
      status: userCallbackTickets.status,
      preferredTimeSlot: userCallbackTickets.preferredTimeSlot,
      createdAt: userCallbackTickets.createdAt,
      updatedAt: userCallbackTickets.updatedAt,
    })
    .from(userCallbackTickets)
    .where(eq(userCallbackTickets.userId, userId))
    .orderBy(desc(userCallbackTickets.createdAt))

  return rows.map((r) => ({
    id: r.id,
    category: r.category,
    status: r.status,
    preferredTimeSlot: r.preferredTimeSlot ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }))
}

/** The reason + time-slot option lists for the callback flow. */
export async function getCallbackOptions(): Promise<{
  reasons: Array<CallbackOption>
  timeslots: Array<CallbackOption>
}> {
  const [reasons, timeslots] = await Promise.all([
    readMenu(REASON_CATEGORY),
    readMenu(TIMESLOT_CATEGORY),
  ])
  return { reasons, timeslots }
}

/**
 * Create a pending callback request.
 *
 * Enforces **one pending callback per (user, batch)** — a duplicate throws
 * `SUPPORT_CALLBACK_DUPLICATE` so the UI can show an inline message instead of
 * silently creating a second request.
 *
 * @returns the new callback id.
 */
export async function createCallback(input: {
  userId: number
  batchId: number
  category: string
  preferredTimeSlot?: string | null
}): Promise<{ id: number }> {
  const existing = await db
    .select({ id: userCallbackTickets.id })
    .from(userCallbackTickets)
    .where(
      and(
        eq(userCallbackTickets.userId, input.userId),
        eq(userCallbackTickets.batchId, input.batchId),
        eq(userCallbackTickets.status, 'pending'),
      ),
    )
    .limit(1)

  if (existing.length > 0) throw new Error('SUPPORT_CALLBACK_DUPLICATE')

  const now = new Date().toISOString()
  const [result] = await db.insert(userCallbackTickets).values({
    userId: input.userId,
    batchId: input.batchId,
    category: input.category,
    status: 'pending',
    preferredTimeSlot: input.preferredTimeSlot ?? null,
    createdAt: now,
    updatedAt: now,
  })

  // TODO(notify): ping the ops Slack channel here (legacy parity).
  return { id: Number(result.insertId) }
}
