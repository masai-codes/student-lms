/**
 * Support module — "request a callback" services.
 *
 *   1. {@link getCallbackOptions} — reason + time-slot choices (from `menus`).
 *   2. {@link createCallback}     — record a pending callback (one per batch).
 *
 * Options live in the shared `menus` table under two category keys (the same
 * keys the legacy system uses), so ops can edit them without a deploy.
 */

import { and, asc, eq } from 'drizzle-orm'
import type { CallbackOption } from '@/server/api/support/support.types'
import { db } from '@/db'
import { menus, userCallbackTickets } from '@/db/schema'

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
