import { eq } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { clubMembers, clubs, users } from '@/db/schema'
import { getCurrentSessionUserId } from '@/server/auth/getCurrentSessionUserId'

function parseClubId(value: string): number {
  const clubId = Number(String(value ?? '').trim())
  if (!Number.isFinite(clubId) || clubId <= 0) {
    throw new Error('INVALID_CLUB_ID')
  }
  return clubId
}

export const joinClub = createServerFn({ method: 'POST' })
  .inputValidator((data: { clubId: string }) => data)
  .handler(joinClubHandler)

export async function joinClubHandler({ data }: { data: { clubId: string } }) {
  const userId = await getCurrentSessionUserId()
  if (!userId) {
    throw new Error('UNAUTHORIZED')
  }

  const currentUser = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const userRole = String(currentUser[0]?.role ?? '')
    .trim()
    .toLowerCase()
  if (userRole === 'admin') {
    throw new Error('ADMIN_CANNOT_JOIN_CLUB')
  }

  const clubId = parseClubId(data.clubId)

  const club = await db
    .select({ id: clubs.id })
    .from(clubs)
    .where(eq(clubs.id, clubId))
    .limit(1)

  if (!club[0]) {
    throw new Error('CLUB_NOT_FOUND')
  }

  const existingMembership = await db
    .select({ clubId: clubMembers.clubId })
    .from(clubMembers)
    .where(eq(clubMembers.userId, userId))
    .limit(1)

  const joinedClubId = existingMembership[0]?.clubId ?? null

  if (joinedClubId != null) {
    return {
      success: joinedClubId === clubId,
      joinedClubId: String(joinedClubId),
      reason: 'ALREADY_JOINED_A_CLUB',
    }
  }

  await db.insert(clubMembers).values({
    userId,
    clubId,
    role: 'member',
  })

  return {
    success: true,
    joinedClubId: String(clubId),
    reason: 'JOINED',
  }
}
