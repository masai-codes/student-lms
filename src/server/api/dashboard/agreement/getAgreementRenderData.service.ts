import { and, eq, isNull, sql } from 'drizzle-orm'
import {
  buildAgreementSteps,
  buildReferenceNumber,
  computeAgreementCountdown,
  pickAgreementFormValues,
  sectionAgreementKey,
} from './agreementShared'
import type { AgreementFormValues, AgreementStepDoc } from './agreementShared'
import { db } from '@/db'
import { batches, profiles, sectionUser, users } from '@/db/schema'
import { resolveSectionLabelFromColumns } from '@/server/batches/resolveSectionLabel'
import { resolveStudentCode } from '@/server/users/getStudentCode'

export interface AgreementSection {
  sectionId: number
  sectionName: string
  programName: string
  batchName: string
  /** Learner's registered email — shown on the signature certificate. */
  email: string
  /** Learner's student code (batch_user.username) — shown on the signature certificate. */
  studentCode: string
  steps: Array<AgreementStepDoc>
  /** Prefill: user's profile defaults merged with any previously-saved values. */
  savedValues: AgreementFormValues
  /** Step keys the user has already accepted. */
  acceptedStepKeys: Array<string>
  /** True once the full agreement is signed (`haveAcceptedLegalAgreement`). */
  completed: boolean
  referenceNumber: string
  agreementPdfUrl: string | null
  /** ISO time the agreement was first viewed (starts the review countdown); null until viewed. */
  viewTime: string | null
  /** ISO time the agreement was signed (`finalSignTime`); null until signed. */
  signedTime: string | null
  /** IP address captured at submit; null until signed. */
  ipAddress: string | null
  /** Whole days elapsed since first view. */
  daysSinceFirstView: number
  /** Days left in the {@link AGREEMENT_REVIEW_DAYS}-day review window (0 when under a day remains). */
  daysLeft: number
  /** Hours left when under a day remains, else null (count down in days). */
  hoursLeft: number | null
  /** False once the window elapses — LMS access is paused until signed. */
  isClosable: boolean
}

function normalizeRows<T>(result: unknown): Array<T> {
  if (Array.isArray(result))
    return (Array.isArray(result[0]) ? result[0] : result) as Array<T>
  if (result && typeof result === 'object' && 'rows' in result)
    return (result as { rows: Array<T> }).rows
  return []
}

function parseJson(raw: unknown): Record<string, unknown> {
  if (!raw) return {}
  if (typeof raw === 'object') return raw as Record<string, unknown>
  try {
    return JSON.parse(String(raw)) as Record<string, unknown>
  } catch {
    return {}
  }
}

/**
 * Safe scalar prefill from the profile (prior saved values override these).
 * Gender is intentionally NOT prefilled — the learner must pick it themselves so
 * nothing is selected by default. Phone country defaults to `+91`.
 */
function profilePrefill(
  userName: string | null,
  birthDate: string | null,
): AgreementFormValues {
  const values: AgreementFormValues = { parentsMobileCountry: '+91' }
  if (userName) values.name = userName
  if (birthDate) values.dateOfBirth = birthDate.slice(0, 10)
  return values
}

/**
 * Full render detail for every eligible agreement the user has in a batch —
 * folded into the dashboard overview's T0 data. Each section carries its ordered
 * signable steps (PDFs), prefill values (profile + prior saves), which steps are
 * already accepted, and completion. No modal state / deadline (non-blocking).
 */
export async function getAgreementRenderData(
  userId: number,
  batchId: number,
): Promise<Array<AgreementSection>> {
  const enrolled = await db
    .select({ sectionId: sectionUser.sectionId })
    .from(sectionUser)
    .where(and(eq(sectionUser.userId, userId), isNull(sectionUser.deletedAt)))
  const sectionIds = [...new Set(enrolled.map((r) => r.sectionId))].filter(
    Number.isFinite,
  )
  if (!sectionIds.length) return []

  const sectionRows = normalizeRows<{
    id: number
    name: string
    section_display_name: string | null
    agreements: string | null
  }>(
    await db.execute(sql`
      SELECT id, name,
             settings->>'$.sectionDisplayName' AS section_display_name,
             settings->>'$.agreements' AS agreements
      FROM sections
      WHERE id IN (${sql.raw(sectionIds.join(', '))})
        AND batch_id = ${batchId}
        AND active = 1
        AND settings->>'$.agreements.shouldModalBeVisible' = 'true'
    `),
  )
  if (!sectionRows.length) return []

  const [[batch], [user], [profile], studentCode] = await Promise.all([
    db
      .select({ name: batches.name, program: batches.program })
      .from(batches)
      .where(eq(batches.id, batchId))
      .limit(1),
    db
      .select({
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
    db
      .select({ birthDate: profiles.birthDate, legalData: profiles.legalData })
      .from(profiles)
      .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
      .limit(1),
    // Student code comes from this batch's batch_user row, never users.username.
    resolveStudentCode(userId, batchId),
  ])

  const baseValues = profilePrefill(
    user?.name ?? null,
    profile?.birthDate ?? null,
  )
  const userAgreements = (parseJson(profile?.legalData)['agreements'] ??
    {}) as Record<string, unknown>

  const sections: Array<AgreementSection> = []
  for (const row of sectionRows) {
    const steps = buildAgreementSteps(parseJson(row.agreements))
    if (!steps.length) continue

    const stored = parseJson(userAgreements[sectionAgreementKey(row.id)])
    const completed = stored['haveAcceptedLegalAgreement'] === true
    const acceptedSteps = parseJson(stored['acceptedSteps'])
    const acceptedStepKeys = completed
      ? steps.map((s) => s.key)
      : steps.filter((s) => acceptedSteps[s.key] === true).map((s) => s.key)

    // Review countdown, keyed off the first-view timestamp.
    const viewTime =
      typeof stored['viewTime'] === 'string' ? stored['viewTime'] : null
    const { daysSinceFirstView, daysLeft, hoursLeft, isClosable } =
      computeAgreementCountdown(viewTime)

    const signedTime =
      typeof stored['finalSignTime'] === 'string'
        ? stored['finalSignTime']
        : null
    const ipAddress =
      typeof stored['ipAddress'] === 'string' ? stored['ipAddress'] : null

    sections.push({
      sectionId: Number(row.id),
      sectionName: resolveSectionLabelFromColumns(
        row.name,
        row.section_display_name,
      ),
      programName: batch?.program ?? '',
      batchName: batch?.name ?? '',
      email: user?.email ?? '',
      studentCode,
      steps,
      savedValues: { ...baseValues, ...pickAgreementFormValues(stored) },
      acceptedStepKeys,
      completed,
      referenceNumber:
        (stored['referenceNumber'] as string | undefined) ??
        buildReferenceNumber(userId, Number(row.id)),
      agreementPdfUrl:
        (stored['agreementPdfUrl'] as string | undefined) ?? null,
      viewTime,
      signedTime,
      ipAddress,
      daysSinceFirstView,
      daysLeft,
      hoursLeft,
      isClosable,
    })
  }
  return sections
}
