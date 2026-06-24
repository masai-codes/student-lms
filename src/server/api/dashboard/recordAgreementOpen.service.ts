import { and, eq, isNull, sql } from 'drizzle-orm'
import { db } from '@/db'
import { profiles } from '@/db/schema'

export async function recordAgreementOpen(userId: number, sectionId: number): Promise<void> {
  const now = new Date().toISOString()

  let [profile] = await db
    .select({ id: profiles.id, legalData: profiles.legalData })
    .from(profiles)
    .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
    .limit(1)

  if (!profile) {
    await db.execute(sql`INSERT INTO profiles (user_id, legal_data) VALUES (${userId}, '{}')`)
    ;[profile] = await db
      .select({ id: profiles.id, legalData: profiles.legalData })
      .from(profiles)
      .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
      .limit(1)
    if (!profile) return
  }

  const legalData = (profile.legalData ?? {}) as Record<string, unknown>
  const agreements = (legalData.agreements ?? {}) as Record<string, unknown>
  const sectionKey = `section_${sectionId}`
  const existing = (agreements[sectionKey] ?? {}) as Record<string, unknown>

  const sectionUpdate: Record<string, unknown> = {
    ...existing,
    lastShownTime: now,
  }
  // viewTime is set only once — on first open
  if (!existing.viewTime) {
    sectionUpdate.viewTime = now
  }

  await db
    .update(profiles)
    .set({
      legalData: {
        ...legalData,
        agreements: {
          ...agreements,
          [sectionKey]: sectionUpdate,
        },
      },
    })
    .where(eq(profiles.id, profile.id))
}
