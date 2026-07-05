import { sql } from 'drizzle-orm'
import { db } from '@/db'

/**
 * Shared "how far through the guided tour is this user?" computation.
 *
 * This is the single source of truth for the guided-tour denominators so the
 * progress bar, the "should we show the tour?" gate, and the stored
 * `user_batch_admission_data.meta` fractions can never disagree. It computes the
 * **web** platform fractions live (self-healing) from the current profile /
 * device / lecture / agreement state:
 *
 * - **LMS walkthrough:** `lms-walkthrough-{platform}` lectures + 2 fixed steps
 *   (profile photo, download app).
 * - **Program onboarding:** `program-onboarding-{platform}` lectures + 1 if the
 *   batch has a valid signable agreement. Only meaningful when full fees are paid.
 *
 * `platform` is `'web'` by default and `'app'` when the request comes from the
 * mobile app (`X-App-Mobile` header) — the app has its own `-app` sections.
 */

/**
 * Which platform's onboarding sections to read/write. `'web'` uses the
 * `-web` sections; `'app'` uses `-app` (served to the mobile app, detected via
 * the `X-App-Mobile` request header).
 */
export type GuidedTourPlatform = 'web' | 'app'

export interface ProgressCount {
  completed: number
  total: number
}

export interface GuidedTourWebProgress {
  lms: ProgressCount
  /** `null` when the user hasn't paid full fees (program tab is locked). */
  program: ProgressCount | null
}

/** The two non-video LMS steps: profile photo + download app. */
export const LMS_WALKTHROUGH_EXTRA_STEPS = 2

const LECTURE_TYPES_COUNTED = ['live', 'recorded', 'scrum', 'video', 'interactive-video']

function normalizeRows<T>(result: unknown): Array<T> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<T>
    return result as Array<T>
  }
  if (result && typeof result === 'object' && 'rows' in result && Array.isArray((result).rows)) {
    return (result as { rows: Array<T> }).rows
  }
  return []
}

function parseMeta(raw: unknown): Record<string, unknown> {
  if (!raw) return {}
  if (typeof raw === 'object') return raw as Record<string, unknown>
  try { return JSON.parse(String(raw)) as Record<string, unknown> } catch { return {} }
}

/** Fraction ("n/d") → ratio in [0, 1]. Empty / malformed → 0. */
export function fracValue(f: string | undefined | null): number {
  if (!f) return 0
  const [n, d] = f.split('/')
  const num = Number(n)
  const den = Number(d)
  return den > 0 ? num / den : 0
}

/** A tab is complete once its numerator reaches its denominator. */
export function isProgressComplete(p: ProgressCount): boolean {
  return p.total <= 0 || p.completed >= p.total
}

function hasHttpUrl(value: unknown): boolean {
  if (typeof value !== 'string' || value.trim() === '') return false
  try {
    const u = new URL(value.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function hasValidAgreementSubKey(agreementsJson: Record<string, unknown>): boolean {
  const RESERVED = new Set(['shouldModalBeVisible'])
  return Object.entries(agreementsJson).some(([key, value]) => {
    if (RESERVED.has(key)) return false
    const entry = value as Record<string, unknown> | null | undefined
    if (!entry || typeof entry !== 'object') return false
    const pdfUrl = entry['pdfUrl']
    const heading = entry['heading']
    const hidePolicy = entry['hidePolicy']
    return (
      typeof pdfUrl === 'string' && pdfUrl.trim() !== '' &&
      typeof heading === 'string' && heading.trim() !== '' &&
      hidePolicy !== true && hidePolicy !== 'true'
    )
  })
}

async function countSectionCompletions(userId: number, sectionId: number): Promise<ProgressCount> {
  const typeList = LECTURE_TYPES_COUNTED.map((t) => `'${t}'`).join(', ')
  const lecs = normalizeRows<{ id: number }>(
    await db.execute(sql`
      SELECT id FROM lectures
      WHERE section_id = ${sectionId}
        AND deleted_at IS NULL
        AND type IN (${sql.raw(typeList)})
      LIMIT 200
    `)
  )
  if (!lecs.length) return { total: 0, completed: 0 }

  const idList = lecs.map((l) => l.id).join(', ')
  const done = normalizeRows<{ lecture_id: number }>(
    await db.execute(sql`
      SELECT DISTINCT lecture_id FROM video_attendances
      WHERE user_id = ${userId}
        AND lecture_id IN (${sql.raw(idList)})
        AND duration >= 10
    `)
  )
  return { total: lecs.length, completed: done.length }
}

async function latestSectionId(batchId: number, type: string): Promise<number | undefined> {
  const rows = normalizeRows<{ id: number }>(
    await db.execute(sql`
      SELECT id FROM sections
      WHERE batch_id = ${batchId} AND type = ${type}
        AND active = 1 AND deleted_at IS NULL
      ORDER BY id DESC LIMIT 1
    `)
  )
  return rows[0]?.id
}

/** Whether this batch has a signable agreement, and whether the user signed it. */
async function computeAgreementState(
  userId: number,
  batchId: number,
  legalData: unknown,
): Promise<{ hasAgreement: boolean; signed: boolean }> {
  const enrolledSectionRows = normalizeRows<{ id: number; agreements: string | null }>(
    await db.execute(sql`
      SELECT s.id, s.settings->>'$.agreements' AS agreements
      FROM section_user su
      JOIN sections s ON s.id = su.section_id
      WHERE su.user_id = ${userId}
        AND su.deleted_at IS NULL
        AND s.batch_id = ${batchId}
        AND s.active = 1
        AND s.deleted_at IS NULL
        AND s.settings->>'$.agreements.shouldModalBeVisible' = 'true'
    `)
  )

  for (const row of enrolledSectionRows) {
    let agreementsJson: Record<string, unknown> | null = null
    try {
      agreementsJson = (typeof row.agreements === 'string' ? JSON.parse(row.agreements) : row.agreements) as Record<string, unknown> | null
    } catch { continue }
    if (agreementsJson && hasValidAgreementSubKey(agreementsJson)) {
      const legal = (parseMeta(legalData)['agreements'] ?? {}) as Record<string, unknown>
      const sectionAgreement = legal[`section_${Number(row.id)}`] as Record<string, unknown> | undefined
      return { hasAgreement: true, signed: sectionAgreement?.['haveAcceptedLegalAgreement'] === true }
    }
  }
  return { hasAgreement: false, signed: false }
}

/**
 * Computes the live guided-tour progress for one admission batch on a given
 * platform (`'web'` → `-web` sections, `'app'` → `-app` sections).
 * `profileMeta` / `legalData` are the profile's `meta` / `legal_data`, and
 * `hasDeviceToken` whether the user has registered a device — passed in so
 * callers that already loaded them don't re-query. The two fixed LMS steps
 * (profile photo, download app) are platform-independent.
 */
export async function computeGuidedTourProgress(
  userId: number,
  batchId: number,
  fullFeesPaid: boolean,
  profileMeta: unknown,
  legalData: unknown,
  hasDeviceToken: boolean,
  platform: GuidedTourPlatform = 'web',
): Promise<GuidedTourWebProgress> {
  const hasPhoto = hasHttpUrl(parseMeta(profileMeta)['profile_pic'])
  const lmsExtraCompleted = (hasPhoto ? 1 : 0) + (hasDeviceToken ? 1 : 0)

  const lmsSectionId = await latestSectionId(batchId, `lms-walkthrough-${platform}`)
  const lmsBase = lmsSectionId ? await countSectionCompletions(userId, lmsSectionId) : { total: 0, completed: 0 }
  const lmsTotal = lmsBase.total + LMS_WALKTHROUGH_EXTRA_STEPS
  const lms: ProgressCount = {
    total: lmsTotal,
    completed: Math.min(lmsBase.completed + lmsExtraCompleted, lmsTotal),
  }

  if (!fullFeesPaid) return { lms, program: null }

  const { hasAgreement, signed } = await computeAgreementState(userId, batchId, legalData)
  const progSectionId = await latestSectionId(batchId, `program-onboarding-${platform}`)
  const progBase = progSectionId ? await countSectionCompletions(userId, progSectionId) : { total: 0, completed: 0 }
  const progTotal = progBase.total + (hasAgreement ? 1 : 0)
  const program: ProgressCount = {
    total: progTotal,
    completed: Math.min(progBase.completed + (signed ? 1 : 0), progTotal),
  }

  return { lms, program }
}

/**
 * Progress for the trimmed **lite** tour shown to non-T0 (no admission row)
 * enrolled users. Strictly three hard-coded steps, both tabs unlocked:
 * - **LMS Walkthrough:** profile photo + download app (no videos).
 * - **Program Onboarding:** the batch's agreement (0 steps when the batch has no
 *   signable agreement).
 */
export async function computeLiteGuidedTourProgress(
  userId: number,
  batchId: number,
  profileMeta: unknown,
  legalData: unknown,
  hasDeviceToken: boolean,
): Promise<{ lms: ProgressCount; program: ProgressCount }> {
  const hasPhoto = hasHttpUrl(parseMeta(profileMeta)['profile_pic'])
  const lms: ProgressCount = {
    total: LMS_WALKTHROUGH_EXTRA_STEPS,
    completed: (hasPhoto ? 1 : 0) + (hasDeviceToken ? 1 : 0),
  }

  const { hasAgreement, signed } = await computeAgreementState(userId, batchId, legalData)
  const program: ProgressCount = {
    total: hasAgreement ? 1 : 0,
    completed: hasAgreement && signed ? 1 : 0,
  }

  return { lms, program }
}
