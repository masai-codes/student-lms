import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { sections, profiles } from '@/db/schema'
import { resolveSectionLabel } from '@/server/batches/resolveSectionLabel'

export interface CourseAgreementItem {
  sectionId: number
  sectionName: string
  alreadyAccepted: boolean
  agreementPdfUrl: string | null
}

export async function getCourseAgreements(
  batchId: number,
  userId: number,
): Promise<CourseAgreementItem[]> {
  const sectionRows = await db
    .select({
      id: sections.id,
      name: sections.name,
      settings: sections.settings,
    })
    .from(sections)
    .where(and(eq(sections.batchId, batchId), isNull(sections.deletedAt)))

  // Only sections that have a visible legal agreement modal
  const agreementSections = sectionRows.filter((s) => {
    const settings = s.settings as Record<string, unknown> | null
    const agreements = settings?.agreements as
      | Record<string, unknown>
      | undefined
    return agreements?.shouldModalBeVisible === true
  })

  if (agreementSections.length === 0) return []

  const [profile] = await db
    .select({ legalData: profiles.legalData })
    .from(profiles)
    .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
    .limit(1)

  const legalData = (profile?.legalData ?? {}) as Record<string, unknown>
  const acceptedAgreements = (legalData.agreements ?? {}) as Record<
    string,
    unknown
  >

  return agreementSections.map((s) => {
    const settings = s.settings as Record<string, unknown> | null
    const agreements = (settings?.agreements ?? {}) as Record<string, unknown>

    // Pick first pdfUrl from any non-meta agreement entry
    let agreementPdfUrl: string | null = null
    for (const [key, val] of Object.entries(agreements)) {
      if (key === 'shouldModalBeVisible') continue
      const entry = val as Record<string, unknown>
      if (typeof entry.pdfUrl === 'string' && entry.pdfUrl.length > 0) {
        agreementPdfUrl = entry.pdfUrl
        break
      }
    }

    const sectionData = (acceptedAgreements[`section_${s.id}`] ?? {}) as Record<
      string,
      unknown
    >

    return {
      sectionId: s.id,
      sectionName: resolveSectionLabel(s.name, s.settings),
      alreadyAccepted: sectionData.haveAcceptedLegalAgreement === true,
      agreementPdfUrl,
    }
  })
}
