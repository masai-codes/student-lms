import { randomBytes } from 'node:crypto'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'

/**
 * Key inside `users.meta` holding the personal feed token. Deliberately the
 * same key the old LMS used, so feed URLs students already added to
 * Google/Outlook/Apple keep resolving after the token host switches here.
 */
const CALENDAR_TOKEN_META_KEY = 'calendar_token'

/**
 * Returns the user's ICS feed URL, minting and persisting the personal token
 * on first use. The token (not a session) is the feed's credential — calendar
 * apps poll the URL unauthenticated.
 */
export async function getCalendarSubscriptionLink(
  userId: number,
  requestOrigin: string,
): Promise<{ calendarUrl: string }> {
  const rows = await db
    .select({ meta: users.meta })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const existing = rows.at(0)
  if (!existing)
    throw new Error('SERVER_ERROR_FETCHING_CALENDAR_SUBSCRIPTION_LINK')

  const meta = (existing.meta ?? {}) as Record<string, unknown>
  let token = meta[CALENDAR_TOKEN_META_KEY]

  if (typeof token !== 'string' || token.length < 16) {
    token = randomBytes(16).toString('hex')
    // Write ONLY this JSON path instead of re-serialising the whole object.
    // `users.meta` is shared with several features that read-modify-write it;
    // a full-object write here would clobber any key another request changed
    // in between (and vice-versa, a lost token silently kills every live
    // calendar subscription, since the feed URL is the token). JSON_SET is
    // atomic at the path level and can't be expressed with the query builder.
    await db
      .update(users)
      .set({
        meta: sql`json_set(coalesce(${users.meta}, '{}'), '$.calendar_token', ${token})`,
      })
      .where(eq(users.id, userId))
  }

  return {
    calendarUrl: `${requestOrigin}/api/calendar/feed/${token as string}.ics`,
  }
}

/**
 * Resolves a feed token back to its user id, or `null`. JSON-path lookup on
 * `users.meta` — not expressible with the query builder, hence the one raw
 * fragment.
 */
export async function findUserIdByCalendarToken(
  token: string,
): Promise<number | null> {
  if (!/^[a-f0-9]{32,64}$/i.test(token)) return null
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(
      sql`json_unquote(json_extract(${users.meta}, '$.calendar_token')) = ${token}`,
    )
    .limit(1)
  return rows.at(0)?.id ?? null
}
