import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { userDeviceTokens, users } from '@/db/schema'

function parseMeta(raw: unknown): Record<string, unknown> {
  if (!raw) return {}
  if (typeof raw === 'object') return raw as Record<string, unknown>
  try {
    return JSON.parse(String(raw)) as Record<string, unknown>
  } catch {
    return {}
  }
}

/**
 * Whether the learner has ever opened the LMS from the mobile app, inferred
 * from `users.meta.firstAppLoginTrackedAt` — written by the legacy API on every
 * app-authenticated `/users/me` call.
 *
 * This is a deliberately separate signal from `user_device_tokens`: a token row
 * only appears once the device *also* grants notification permission, so a real
 * app user who declined the prompt never gets one. On prod that is ~8% of all
 * tracked app users (~13% on iOS), and the row is never created later — so
 * keying "download app" solely off the token row keeps nagging learners who
 * already installed it.
 */
export function hasAppLoginTracked(meta: unknown): boolean {
  return parseMeta(meta)['firstAppLoginTrackedAt'] != null
}

/**
 * The "download app" onboarding step is complete when EITHER signal is present:
 * a `user_device_tokens` row (any row, active or not — a past registration
 * still proves the install) or a tracked app login in `users.meta`.
 */
export async function hasCompletedAppDownload(
  userId: number,
): Promise<boolean> {
  const [tokenRows, userRows] = await Promise.all([
    db
      .select({ id: userDeviceTokens.id })
      .from(userDeviceTokens)
      .where(eq(userDeviceTokens.userId, userId))
      .limit(1),
    db
      .select({ meta: users.meta })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
  ])

  return tokenRows.length > 0 || hasAppLoginTracked(userRows[0]?.meta)
}
