import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { sessions } from '@/db/schema'

type SessionInsert = typeof sessions.$inferInsert
type SessionSelect = typeof sessions.$inferSelect

export type CreateSessionOverrides = Partial<SessionInsert>

/** Unix *seconds* — the unit `sessions.last_activity` stores. */
const nowInSeconds = () => Math.floor(Date.now() / 1000)

/**
 * Inserts a `sessions` row so the profile's Account Activity tab has devices to
 * list. `id` is the primary key (a Laravel-style session id string), not an
 * autoincrement, so it must be unique per row — namespace it by flow id.
 */
export async function createSession(
  overrides: CreateSessionOverrides = {},
): Promise<SessionSelect> {
  const { id, userId } = overrides
  if (!id || userId == null) {
    throw new Error('createSession requires id and userId')
  }

  const values: SessionInsert = {
    payload: '',
    lastActivity: nowInSeconds(),
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ...overrides,
    id,
    userId,
  }

  await db.insert(sessions).values(values)

  const [row] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, id))
    .limit(1)
  if (!row) {
    throw new Error(`Failed to load session after insert (id=${id})`)
  }

  return row
}
