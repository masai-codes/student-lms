import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { profiles } from '@/db/schema'

export interface EmailPreferences {
  lectures: boolean
  assignments: boolean
  evaluations: boolean
  announcements: boolean
  tickets: boolean
  discussions: boolean
}

const DEFAULTS: EmailPreferences = {
  lectures: false,
  assignments: false,
  evaluations: false,
  announcements: false,
  tickets: false,
  discussions: false,
}

const PREF_KEYS = Object.keys(DEFAULTS) as Array<keyof EmailPreferences>

function parsePrefs(meta: unknown): EmailPreferences {
  if (!meta || typeof meta !== 'object') return { ...DEFAULTS }
  const m = meta as Record<string, unknown>
  const en = m.email_notifications
  if (!en || typeof en !== 'object') return { ...DEFAULTS }
  const p = en as Record<string, unknown>
  const result = { ...DEFAULTS }
  for (const key of PREF_KEYS) {
    if (typeof p[key] === 'boolean') result[key] = p[key] as boolean
  }
  return result
}

type RawRow = { meta: unknown }

function normalizeRows(result: unknown): Array<RawRow> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<RawRow>
    return result as Array<RawRow>
  }
  if (
    result &&
    typeof result === 'object' &&
    'rows' in result &&
    Array.isArray(result.rows)
  ) {
    return (result as { rows: Array<RawRow> }).rows
  }
  return []
}

/**
 * Reads email notification preferences from the latest non-deleted profile row.
 * Stored at: profiles.meta.email_notifications
 */
export async function getEmailPreferences(
  userId: number,
): Promise<EmailPreferences> {
  const result = await db.execute(sql`
    SELECT p.meta
    FROM profiles p
    INNER JOIN (
      SELECT MAX(id) AS latestId
      FROM profiles
      WHERE user_id = ${userId}
        AND deleted_at IS NULL
    ) lp ON lp.latestId = p.id
    LIMIT 1
  `)

  const row = normalizeRows(result)[0]
  return parsePrefs(row?.meta)
}

/**
 * Merges the given updates into profiles.meta.email_notifications.
 * Does a full JSON merge — reads current meta, patches email_notifications, writes back.
 */
export async function updateEmailPreferences(
  userId: number,
  updates: Partial<EmailPreferences>,
): Promise<EmailPreferences> {
  // 1. Get current state
  const current = await getEmailPreferences(userId)
  const merged = { ...current, ...updates }

  // 2. Fetch the full meta blob + profile id
  const result = await db.execute(sql`
    SELECT p.id, p.meta
    FROM profiles p
    INNER JOIN (
      SELECT MAX(id) AS latestId
      FROM profiles
      WHERE user_id = ${userId}
        AND deleted_at IS NULL
    ) lp ON lp.latestId = p.id
    LIMIT 1
  `)

  const rows = normalizeRows(result)
  const row = rows[0] as { id: number | string; meta: unknown } | undefined

  if (!row) {
    // No profile row yet — nothing to update
    return merged
  }

  const profileId = Number(row.id)
  const existingMeta = (
    row.meta && typeof row.meta === 'object' ? row.meta : {}
  ) as Record<string, unknown>
  const newMeta = { ...existingMeta, email_notifications: merged }

  // 3. Write back — full JSON merge
  await db
    .update(profiles)
    .set({
      meta: newMeta,
      updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    })
    .where(sql`${profiles.id} = ${profileId}`)

  return merged
}
