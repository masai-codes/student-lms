import { eq } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { clubMembers } from '@/db/schema'
import { getCurrentSessionUserId } from '@/server/auth/getCurrentSessionUserId'

export const fetchMyClubMembership = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = await getCurrentSessionUserId()
  if (!userId) return null

  const membership = await db
    .select({ clubId: clubMembers.clubId })
    .from(clubMembers)
    .where(eq(clubMembers.userId, userId))
    .limit(1)

  return {
    joinedClubId: membership[0]?.clubId ?? null,
  }
})
