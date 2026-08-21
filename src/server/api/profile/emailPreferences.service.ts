import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import {
  EMAIL_PREFERENCE_KEYS,
  type EmailPreferenceKey,
  type EmailPreferences,
} from '@/server/api/profile/profile.types'

/**
 * Preferences live on `profiles.meta.email_notifications` — the same key the old
 * LMS and experience-api read and write, so the two systems stay in sync. There
 * is no dedicated table.
 */
const EMAIL_NOTIFICATIONS_META_KEY = 'email_notifications'

/** Everything is opt-out: an absent key means the student gets that email. */
function defaultPreferences(): EmailPreferences {
  return Object.fromEntries(
    EMAIL_PREFERENCE_KEYS.map((key) => [key, true]),
  ) as EmailPreferences
}

function readPreferences(meta: unknown): EmailPreferences {
  const defaults = defaultPreferences()
  if (!meta || typeof meta !== 'object') return defaults

  const stored = (meta as Record<string, unknown>)[EMAIL_NOTIFICATIONS_META_KEY]
  if (!stored || typeof stored !== 'object') return defaults

  const storedRecord = stored as Record<string, unknown>
  for (const key of EMAIL_PREFERENCE_KEYS) {
    if (typeof storedRecord[key] === 'boolean') {
      defaults[key] = storedRecord[key]
    }
  }
  return defaults
}

/** Narrows an arbitrary object to the six preference keys this app exposes. */
export function parsePreferencePatch(body: unknown): Partial<EmailPreferences> {
  if (!body || typeof body !== 'object') return {}
  const record = body as Record<string, unknown>
  const patch: Partial<EmailPreferences> = {}
  for (const key of EMAIL_PREFERENCE_KEYS) {
    if (typeof record[key] === 'boolean') patch[key] = record[key]
  }
  return patch
}

export async function getEmailPreferences(
  userId: number,
): Promise<EmailPreferences> {
  const [profile] = await db
    .select({ meta: profiles.meta })
    .from(profiles)
    .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
    .limit(1)

  return readPreferences(profile?.meta)
}

/**
 * Applies a partial update, preserving every other key on `profiles.meta`
 * (including the `messages` / `app_download_reminder` flags this UI does not
 * expose but other systems write) and creating the profile row if needed.
 */
export async function updateEmailPreferences(
  userId: number,
  patch: Partial<EmailPreferences>,
): Promise<EmailPreferences> {
  const keys = Object.keys(patch) as Array<EmailPreferenceKey>
  if (keys.length === 0) throw new ApiError(400, 'NO_PREFERENCES_TO_UPDATE')

  const [profile] = await db
    .select({ id: profiles.id, meta: profiles.meta })
    .from(profiles)
    .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
    .limit(1)

  const existingMeta = (
    profile?.meta && typeof profile.meta === 'object' ? profile.meta : {}
  ) as Record<string, unknown>

  const existingNotifications = (
    existingMeta[EMAIL_NOTIFICATIONS_META_KEY] &&
    typeof existingMeta[EMAIL_NOTIFICATIONS_META_KEY] === 'object'
      ? existingMeta[EMAIL_NOTIFICATIONS_META_KEY]
      : {}
  ) as Record<string, unknown>

  const nextMeta = {
    ...existingMeta,
    [EMAIL_NOTIFICATIONS_META_KEY]: { ...existingNotifications, ...patch },
  }

  if (profile) {
    await db
      .update(profiles)
      .set({ meta: nextMeta })
      .where(eq(profiles.id, profile.id))
  } else {
    await db.insert(profiles).values({ userId, meta: nextMeta })
  }

  return readPreferences(nextMeta)
}
