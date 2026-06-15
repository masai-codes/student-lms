import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { isAdminRole } from '@/server/auth/v2/portalGate'

/**
 * The `users.meta` key that persists whether an admin has switched Masaiverse
 * into admin mode. Only meaningful for users whose DB `role` is admin.
 */
export const ADMIN_MODE_META_KEY = 'isMasaiverseAdminModeEnabled'

/** Current admin-mode state for a user, as exposed to the client. */
export type MasaiverseV2AdminModeState = {
  /** Whether the DB role grants admin capabilities at all. */
  isAdmin: boolean
  /** Whether admin mode is currently toggled on (always false for non-admins). */
  enabled: boolean
}

type UserRoleAndMeta = {
  role: string | null
  meta: Record<string, unknown>
}

async function fetchRoleAndMeta(userId: number): Promise<UserRoleAndMeta | null> {
  const rows = await db
    .select({ role: users.role, meta: users.meta })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const row = rows.at(0)
  if (!row) return null

  return {
    role: row.role ?? null,
    meta: (row.meta ?? {}) as Record<string, unknown>,
  }
}

function readEnabledFlag(meta: Record<string, unknown>): boolean {
  return meta[ADMIN_MODE_META_KEY] === true
}

/**
 * Reads the user's admin-mode state. Non-admins (and missing users) resolve to
 * `{ isAdmin: false, enabled: false }` so the client can simply hide the toggle.
 */
export async function getAdminModeState(
  userId: number,
): Promise<MasaiverseV2AdminModeState> {
  const record = await fetchRoleAndMeta(userId)
  if (!record || !isAdminRole(record.role)) {
    return { isAdmin: false, enabled: false }
  }

  return { isAdmin: true, enabled: readEnabledFlag(record.meta) }
}

/**
 * Toggles admin mode on/off, persisting it to `users.meta`. Rejects non-admin
 * users with a 403 so the capability is gated on the DB role, not just the UI.
 * Existing meta keys are preserved.
 */
export async function setAdminModeState(
  userId: number,
  enabled: boolean,
): Promise<MasaiverseV2AdminModeState> {
  const record = await fetchRoleAndMeta(userId)
  if (!record || !isAdminRole(record.role)) {
    throw new ApiError(403, 'MASAIVERSE_ADMIN_FORBIDDEN')
  }

  await db
    .update(users)
    .set({ meta: { ...record.meta, [ADMIN_MODE_META_KEY]: enabled } })
    .where(eq(users.id, userId))

  return { isAdmin: true, enabled }
}
