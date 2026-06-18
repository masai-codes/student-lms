import { eq } from 'drizzle-orm'
import { getAdminModeState } from './adminMode.service'
import { MANUAL_LEADERBOARD_REASON } from './leaderboardPoints'
import { db } from '@/db'
import { clubs, masaiverseLeaderboard, users } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'

/** Guard against fat-finger entries; admins can still award within this range. */
const MAX_POINTS = 1_000_000

export interface AwardManualPointsInput {
  /** The member who receives the points. */
  targetUserId: number
  /** Signed integer; negative deducts. Zero is rejected. */
  points: number
  /** Club to scope the points to, or `null` for community-wide. */
  clubId: number | null
}

/**
 * Inserts a hand-assigned `masaiverse_leaderboard` row (reason `manual`) crediting
 * `targetUserId` and stamping `createdBy` with the acting admin. Admin-only
 * (403 otherwise); validates the amount and that the target user (and club, when
 * given) exist. Returns the new row id.
 */
export async function awardManualPoints(
  adminUserId: number,
  input: AwardManualPointsInput,
): Promise<{ id: string }> {
  const state = await getAdminModeState(adminUserId)
  if (!state.isAdmin) throw new ApiError(403, 'MASAIVERSE_ADMIN_FORBIDDEN')

  const { targetUserId, points, clubId } = input
  if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
    throw new ApiError(400, 'INVALID_USER_ID')
  }
  if (
    !Number.isInteger(points) ||
    points === 0 ||
    Math.abs(points) > MAX_POINTS
  ) {
    throw new ApiError(400, 'INVALID_POINTS')
  }

  const target = (
    await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1)
  ).at(0)
  if (!target) throw new ApiError(404, 'USER_NOT_FOUND')

  if (clubId != null) {
    if (!Number.isInteger(clubId) || clubId <= 0) {
      throw new ApiError(400, 'INVALID_CLUB_ID')
    }
    const club = (
      await db
        .select({ id: clubs.id })
        .from(clubs)
        .where(eq(clubs.id, clubId))
        .limit(1)
    ).at(0)
    if (!club) throw new ApiError(404, 'CLUB_NOT_FOUND')
  }

  const [row] = await db.insert(masaiverseLeaderboard).values({
    userId: targetUserId,
    createdBy: adminUserId,
    reason: MANUAL_LEADERBOARD_REASON,
    points,
    clubId,
  })

  return { id: String(row.insertId) }
}
