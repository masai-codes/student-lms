import { isNull, notInArray, or } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { users } from '@/db/schema'

/**
 * Roles that are excluded from every leaderboard. Admins (and super admins)
 * award points and moderate the community, so they must never be ranked or
 * counted in anyone else's placement. Mirrors `isAdminRole`.
 */
const EXCLUDED_LEADERBOARD_ROLES = ['admin', 'super_admin']

/**
 * Restricts a leaderboard query to rankable members: anyone whose role is not
 * an admin role. A `NULL` role is a regular member, so it stays eligible.
 *
 * Every query that ranks or counts members (the board itself and the
 * rank-of-current-user counts) must join `users` and apply this so admins are
 * neither listed nor counted as ranked above other members.
 */
export const rankableMemberCondition: SQL = or(
  isNull(users.role),
  notInArray(users.role, EXCLUDED_LEADERBOARD_ROLES),
) as SQL
