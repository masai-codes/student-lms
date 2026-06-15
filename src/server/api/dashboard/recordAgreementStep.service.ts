import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { profiles } from '@/db/schema'

export async function recordAgreementStep(
  sectionId: number,
  userId: number,
  stepKey: string,
): Promise<void> {
  const [profile] = await db
    .select({ id: profiles.id, legalData: profiles.legalData })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1)

  if (!profile) return

  const now = new Date().toISOString()
  const legalData = (profile.legalData ?? {}) as Record<string, unknown>
  const agreements = (legalData.agreements ?? {}) as Record<string, unknown>
  const sectionKey = `section_${sectionId}`
  const existing = (agreements[sectionKey] ?? {}) as Record<string, unknown>

  await db
    .update(profiles)
    .set({
      legalData: {
        ...legalData,
        agreements: {
          ...agreements,
          [sectionKey]: { ...existing, [stepKey]: now },
        },
      },
    })
    .where(eq(profiles.id, profile.id))
}
