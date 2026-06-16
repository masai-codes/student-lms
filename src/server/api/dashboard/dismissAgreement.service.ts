import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { profiles } from '@/db/schema'

export async function dismissAgreement(userId: number, sectionId: number): Promise<void> {
  const [profile] = await db
    .select({ id: profiles.id, legalData: profiles.legalData })
    .from(profiles)
    .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
    .limit(1)

  if (!profile) return

  const now = new Date().toISOString()
  const legalData = (profile.legalData ?? {}) as Record<string, unknown>
  const agreements = (legalData.agreements ?? {}) as Record<string, unknown>
  const sectionKey = `section_${sectionId}`
  const existing = (agreements[sectionKey] ?? {}) as Record<string, unknown>

  const modalCloseCount = typeof legalData.modalCloseCount === 'number'
    ? legalData.modalCloseCount + 1
    : 1

  await db
    .update(profiles)
    .set({
      legalData: {
        ...legalData,
        lastModalCloseTime: now,
        modalCloseCount,
        agreements: {
          ...agreements,
          [sectionKey]: { ...existing, lastShownTime: now },
        },
      },
    })
    .where(eq(profiles.id, profile.id))
}
