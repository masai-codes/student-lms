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

  const now = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString()
  const legalData = (profile.legalData ?? {}) as Record<string, unknown>
  const agreements = (legalData.agreements ?? {}) as Record<string, unknown>
  const sectionKey = `section_${sectionId}`
  const existing = (agreements[sectionKey] ?? {}) as Record<string, unknown>

  const modalCloseCount = typeof existing.modalCloseCount === 'number'
    ? existing.modalCloseCount + 1
    : 1

  await db
    .update(profiles)
    .set({
      legalData: {
        ...legalData,
        agreements: {
          ...agreements,
          [sectionKey]: {
            ...existing,
            modalCloseCount,
            lastModalCloseTime: now,
          },
        },
      },
    })
    .where(eq(profiles.id, profile.id))
}
