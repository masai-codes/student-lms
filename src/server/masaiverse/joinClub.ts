import { eq, sql } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { clubMembers, clubs } from '@/db/schema'
import { getCurrentSessionUserId } from '@/server/auth/getCurrentSessionUserId'

export const joinClub = createServerFn({ method: 'POST' })
  .inputValidator((data: { clubId: string }) => data)
  .handler(joinClubHandler)

export async function joinClubHandler({ data }: { data: { clubId: string } }) {
  const userId = await getCurrentSessionUserId()
  if (!userId) {
    throw new Error('UNAUTHORIZED')
  }

  const clubId = data.clubId.trim()
  if (!clubId) {
    throw new Error('INVALID_CLUB_ID')
  }

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

  if (joinedClubId) {
    return {
      success: joinedClubId === clubId,
      joinedClubId,
      reason: 'ALREADY_JOINED_A_CLUB',
    }
  }

  await db
    .insert(clubMembers)
    .values({
      id: sql`UUID()` as unknown as string,
      userId,
      clubId,
      role: 'member',
    })

  return {
    success: true,
    joinedClubId: clubId,
    reason: 'JOINED',
  }
}
