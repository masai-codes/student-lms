import { and, eq, inArray, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { batches, profiles, sectionUser, sections } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import type { PendingUndertaking } from '@/server/api/profile/profile.types'

interface UndertakingTemplate {
  shouldModalBeVisible?: unknown
  pdfUrl?: unknown
  heading?: unknown
}

/** `sections.settings.undertaking_template`, defensively read. */
function readTemplate(settings: unknown): UndertakingTemplate {
  if (!settings || typeof settings !== 'object') return {}
  const template = (settings as Record<string, unknown>).undertaking_template
  if (!template || typeof template !== 'object') return {}
  return template
}

/** Per-section acceptance state, stored at `profiles.legal_data.undertakings`. */
function readAcceptedSectionKeys(legalData: unknown): Set<string> {
  const accepted = new Set<string>()
  if (!legalData || typeof legalData !== 'object') return accepted

  const undertakings = (legalData as Record<string, unknown>).undertakings
  if (!undertakings || typeof undertakings !== 'object') return accepted

  for (const [key, value] of Object.entries(
    undertakings as Record<string, unknown>,
  )) {
    if (value && typeof value === 'object') {
      if ((value as Record<string, unknown>).accepted) accepted.add(key)
    }
  }
  return accepted
}

const sectionKey = (sectionId: number) => `section_${sectionId}`

/**
 * Acknowledgements the student still owes: active enrolled sections whose
 * settings carry an undertaking template flagged visible with a PDF, minus the
 * ones already accepted.
 */
export async function getPendingUndertakings(
  userId: number,
): Promise<Array<PendingUndertaking>> {
  const enrolments = await db
    .select({ sectionId: sectionUser.sectionId })
    .from(sectionUser)
    .where(and(eq(sectionUser.userId, userId), isNull(sectionUser.deletedAt)))

  const sectionIds = [...new Set(enrolments.map((row) => row.sectionId))]
  if (sectionIds.length === 0) return []

  const [profile] = await db
    .select({ legalData: profiles.legalData })
    .from(profiles)
    .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
    .limit(1)

  const acceptedKeys = readAcceptedSectionKeys(profile?.legalData)

  const rows = await db
    .select({
      sectionId: sections.id,
      sectionName: sections.name,
      settings: sections.settings,
      batchId: batches.id,
      batchName: batches.name,
      program: batches.program,
    })
    .from(sections)
    .innerJoin(batches, eq(batches.id, sections.batchId))
    .where(and(inArray(sections.id, sectionIds), eq(sections.active, 1)))

  const pending: Array<PendingUndertaking> = []
  for (const row of rows) {
    if (acceptedKeys.has(sectionKey(row.sectionId))) continue

    const template = readTemplate(row.settings)
    const pdfUrl =
      typeof template.pdfUrl === 'string' ? template.pdfUrl.trim() : ''
    if (template.shouldModalBeVisible !== true || pdfUrl === '') continue

    pending.push({
      sectionId: row.sectionId,
      sectionName: row.sectionName,
      batchId: row.batchId,
      batchName: row.batchName,
      program: row.program,
      heading:
        typeof template.heading === 'string' && template.heading.trim() !== ''
          ? template.heading
          : 'Undertaking',
      pdfUrl,
    })
  }

  return pending
}

export interface AcceptUndertakingInput {
  sectionId: number
  ipAddress: string
  location: string
}

/**
 * Records acceptance for one section, stamping the IP + resolved location the
 * client captured (the acknowledgement is a legal record, hence the provenance).
 *
 * Enrolment is re-checked server-side so a student cannot accept on behalf of a
 * section they are not in.
 */
export async function acceptUndertaking(
  userId: number,
  input: AcceptUndertakingInput,
): Promise<void> {
  const { sectionId, ipAddress, location } = input

  if (!Number.isInteger(sectionId) || sectionId <= 0) {
    throw new ApiError(400, 'INVALID_SECTION_ID')
  }
  if (location.trim() === '') throw new ApiError(400, 'LOCATION_REQUIRED')

  const [enrolment] = await db
    .select({ id: sectionUser.id })
    .from(sectionUser)
    .where(
      and(
        eq(sectionUser.userId, userId),
        eq(sectionUser.sectionId, sectionId),
        isNull(sectionUser.deletedAt),
      ),
    )
    .limit(1)

  if (!enrolment) throw new ApiError(403, 'NOT_ENROLLED_IN_SECTION')

  const [section] = await db
    .select({ settings: sections.settings })
    .from(sections)
    .where(and(eq(sections.id, sectionId), eq(sections.active, 1)))
    .limit(1)

  if (!section) throw new ApiError(404, 'SECTION_NOT_FOUND')

  const template = readTemplate(section.settings)
  const pdfUrl = typeof template.pdfUrl === 'string' ? template.pdfUrl : ''
  if (pdfUrl.trim() === '') throw new ApiError(404, 'UNDERTAKING_NOT_FOUND')

  const [profile] = await db
    .select({ id: profiles.id, legalData: profiles.legalData })
    .from(profiles)
    .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
    .limit(1)

  const existingLegalData = (
    profile?.legalData && typeof profile.legalData === 'object'
      ? profile.legalData
      : {}
  ) as Record<string, unknown>

  const existingUndertakings = (
    existingLegalData.undertakings &&
    typeof existingLegalData.undertakings === 'object'
      ? existingLegalData.undertakings
      : {}
  ) as Record<string, unknown>

  const nextLegalData = {
    ...existingLegalData,
    undertakings: {
      ...existingUndertakings,
      [sectionKey(sectionId)]: {
        accepted: true,
        signTime: new Date().toISOString(),
        ipAddress,
        location,
        undertakingPdfUrl: pdfUrl,
      },
    },
  }

  if (profile) {
    await db
      .update(profiles)
      .set({ legalData: nextLegalData })
      .where(eq(profiles.id, profile.id))
  } else {
    await db.insert(profiles).values({ userId, legalData: nextLegalData })
  }
}
