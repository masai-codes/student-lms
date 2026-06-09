import { like, or } from 'drizzle-orm'
import { getAdminModeState } from './adminMode.service'
import { db } from '@/db'
import { users } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'

/** One matched user shown in the admin "assign points" picker. */
export interface UserSearchResult {
  id: string
  name: string
  email: string
  /** `users.profile_photo_path`; null when the member has no photo. */
  avatarUrl: string | null
}

/** Below this query length the picker stays quiet rather than dumping everyone. */
const MIN_QUERY = 2
const LIMIT = 10

/**
 * Admin-only user search by name or email (case-insensitive `LIKE`), capped at a
 * handful of matches. Returns `[]` for short/blank queries; throws 403 for
 * non-admins so the picker is gated on the DB role, not just the UI.
 */
export async function searchUsers(
  adminUserId: number,
  query: string,
): Promise<Array<UserSearchResult>> {
  const state = await getAdminModeState(adminUserId)
  if (!state.isAdmin) throw new ApiError(403, 'MASAIVERSE_ADMIN_FORBIDDEN')

  const trimmed = query.trim()
  if (trimmed.length < MIN_QUERY) return []

  const term = `%${trimmed}%`
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.profilePhotoPath,
    })
    .from(users)
    .where(or(like(users.name, term), like(users.email, term)))
    .limit(LIMIT)

  return rows.map((row) => ({
    id: String(row.id),
    name: row.name,
    email: row.email,
    avatarUrl: row.avatarUrl ?? null,
  }))
}
