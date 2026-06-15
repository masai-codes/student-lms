import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { profiles } from '@/db/schema'

export async function recordAgreementOpen(userId: number): Promise<void> {
  const [profile] = await db
    .select({ id: profiles.id, legalData: profiles.legalData })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1)

  if (!profile) return

  const now = new Date().toISOString()
  const legalData = (profile.legalData ?? {}) as Record<string, unknown>

  await db
    .update(profiles)
    .set({ legalData: { ...legalData, viewTime: now, lastShownTime: now } })
    .where(eq(profiles.id, profile.id))
}
