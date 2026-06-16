import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { profiles } from '@/db/schema'

function getAgreementFieldName(stepKey: string): string {
  switch (stepKey) {
    case 'program_agreement': return 'programAgreement'
    case 'grading_policy': return 'criteriaAgreement'
    case 'posh_compliance': return 'poshAgreement'
    default: return stepKey
  }
}

export async function recordAgreementStep(
  sectionId: number,
  userId: number,
  stepKey: string,
): Promise<void> {
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

  const fieldName = getAgreementFieldName(stepKey)
  const isFirstAcceptance = !existing[fieldName]
  const timeKey = isFirstAcceptance ? `${fieldName}CreateTime` : `${fieldName}UpdateTime`

  await db
    .update(profiles)
    .set({
      legalData: {
        ...legalData,
        agreements: {
          ...agreements,
          [sectionKey]: {
            ...existing,
            [fieldName]: now,
            [timeKey]: now,
          },
        },
      },
    })
    .where(eq(profiles.id, profile.id))
}
