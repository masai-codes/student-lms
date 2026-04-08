import { eq } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { clubMembers } from '@/db/schema'
import { getCurrentSessionUserId } from '@/server/auth/getCurrentSessionUserId'

export const fetchMyClubMembership = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = await getCurrentSessionUserId()
  if (!userId) return null

  const membership = await db
    .select({
      clubId: clubMembers.clubId,
      role: clubMembers.role,
    })
    .from(clubMembers)
    .where(eq(clubMembers.userId, userId))
    .limit(1)

  const role = membership[0]?.role ?? null
  const normalizedRole = role?.toLowerCase().replace(/[_\s-]+/g, '')

  return {
    joinedClubId: membership[0]?.clubId ?? null,
    role,
    isAltLead: normalizedRole === 'altlead',
  }
})
