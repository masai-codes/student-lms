import { and, eq, isNull, sql } from 'drizzle-orm'
import { db } from '@/db'
import { assessNpsForm, assessNpsSubmissions, batchUser, npsForms, npsSubmissions, profiles, sectionUser, userDeviceTokens, users } from '@/db/schema'

export interface PendingAgreementSection {
  sectionId: number
  name: string
}

export interface PendingFeedbackForm {
  id: number
  title: string
  source: 'nps' | 'assess_nps'
}

export interface DashboardActionBannersResult {
  pendingAgreementSections: Array<PendingAgreementSection>
  pendingFeedbackForms: Array<PendingFeedbackForm>
  showZoom: boolean
  showDownloadApp: boolean
  showProfilePicture: boolean
}

function normalizeRows(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<Record<string, unknown>>
    return result as Array<Record<string, unknown>>
  }
  if (result && typeof result === 'object' && 'rows' in result && Array.isArray((result).rows)) {
    return (result as { rows: Array<Record<string, unknown>> }).rows
  }
  return []
}

/**
 * Returns true if the agreements JSON for a section has at least one valid sub-key
 * (e.g. grading_policy, posh_compliance, program_agreement) that has:
 *   - non-empty pdfUrl
 *   - non-empty heading
 *   - hidePolicy != true
 * Ignores the reserved key 'shouldModalBeVisible'.
 */
function hasValidAgreementSubKey(agreementsJson: Record<string, unknown>): boolean {
  const RESERVED_KEYS = new Set(['shouldModalBeVisible'])
  return Object.entries(agreementsJson).some(([key, value]) => {
    if (RESERVED_KEYS.has(key)) return false
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

/**
 * Returns one entry per qualifying unaccepted section, each carrying the heading
 * from its first valid agreement sub-key (grading_policy, posh_compliance, …).
 * Returns an empty array when no banners are needed.
 */
export async function checkAgreementRequired(userId: number): Promise<Array<PendingAgreementSection>> {
  const sectionRows = await db
    .select({ sectionId: sectionUser.sectionId })
    .from(sectionUser)
    .where(and(eq(sectionUser.userId, userId), isNull(sectionUser.deletedAt)))

  if (sectionRows.length === 0) return []

  const sectionIds = [...new Set(sectionRows.map((r) => r.sectionId))].filter(Number.isFinite)
  if (sectionIds.length === 0) return []

  // Fetch active sections with shouldModalBeVisible = true — pull full agreements JSON
  // for JS-side sub-key inspection (keys like grading_policy, posh_compliance are dynamic)
  const sectionResult = normalizeRows(
    await db.execute(sql`
      SELECT id, name, settings->>'$.agreements' AS agreements
      FROM sections
      WHERE id IN (${sql.raw(sectionIds.join(', '))})
        AND active = 1
        AND settings->>'$.agreements.shouldModalBeVisible' = 'true'
    `)
  )

  if (sectionResult.length === 0) return []

  // Check if user has already accepted each section
  const profileRows = await db
    .select({ legalData: profiles.legalData })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1)

  const legalData = profileRows[0]?.legalData as Record<string, unknown> | null | undefined
  const userAgreements = (legalData?.['agreements'] ?? {}) as Record<string, unknown>

  const pending: Array<PendingAgreementSection> = []

  for (const row of sectionResult) {
    const sectionId = Number(row.id)

    // Skip if already accepted
    const sectionKey = `section_${sectionId}`
    const sectionAgreement = userAgreements[sectionKey] as Record<string, unknown> | undefined
    if (sectionAgreement?.['haveAcceptedLegalAgreement'] === true) continue

    // If the user first opened this section's agreement modal more than 7 days ago, the window has closed
    const sectionViewTime = sectionAgreement?.['viewTime'] as string | null | undefined
    if (sectionViewTime) {
      const daysSinceFirstView = Math.floor(
        (Date.now() - new Date(sectionViewTime).getTime()) / (1000 * 60 * 60 * 24),
      )
      if (daysSinceFirstView >= 7) continue
    }

    // Parse agreements JSON and find first valid sub-key
    let agreementsJson: Record<string, unknown> | null = null
    try {
      agreementsJson = (
        typeof row.agreements === 'string' ? JSON.parse(row.agreements) : row.agreements
      ) as Record<string, unknown> | null
    } catch {
      continue
    }
    if (!agreementsJson || typeof agreementsJson !== 'object') continue

    if (!hasValidAgreementSubKey(agreementsJson)) continue

    pending.push({ sectionId, name: String(row.name ?? '') })
  }

  return pending
}

/**
 * Show feedback banner when:
 * - User is enrolled in a section (section_user, not deleted)
 * - That section has an active, published NPS form (nps_forms) OR an active assess NPS form
 *   (assess_nps_form) with an open window
 * - User has not submitted that form
 * Returns all pending forms from both sources merged, ordered by starts_at ASC, created_at ASC.
 */
function isAssessCompleted(sub: { completedAt: string | null; assessCallback: string | null }): boolean {
  if (sub.completedAt) return true
  const cb = sub.assessCallback
  if (!cb) return false
  if (cb === 'true') return true
  // Legacy: callback stored as JSON (older rows)
  try {
    const parsed = JSON.parse(cb) as { eventType?: string }
    return parsed.eventType === 'endAssessment' || parsed.eventType === 'gradingDurationOver'
  } catch {
    return false
  }
}

async function checkFeedbackPending(userId: number): Promise<Array<PendingFeedbackForm>> {
  const [sectionRows, batchRows] = await Promise.all([
    db.select({ sectionId: sectionUser.sectionId })
      .from(sectionUser)
      .where(and(eq(sectionUser.userId, userId), isNull(sectionUser.deletedAt))),
    db.select({ batchId: batchUser.batchId })
      .from(batchUser)
      .where(eq(batchUser.userId, userId)),
  ])

  const sectionIds = [...new Set(sectionRows.map((r) => r.sectionId))].filter(Number.isFinite)
  const batchIds = [...new Set(batchRows.map((r) => r.batchId))].filter(Number.isFinite)

  if (sectionIds.length === 0 && batchIds.length === 0) return []

  const sectionIdList = sectionIds.length > 0 ? sql.raw(sectionIds.join(', ')) : null
  const batchIdList = batchIds.length > 0 ? sql.raw(batchIds.join(', ')) : null
  const nowIst = sql`CONVERT_TZ(NOW(), '+00:00', '+05:30')`

  // ── nps_forms ──────────────────────────────────────────────────────────────
  const activeNpsForms = sectionIdList ? await db
    .select({ id: npsForms.id, title: npsForms.title, startsAt: npsForms.startsAt, createdAt: npsForms.createdAt })
    .from(npsForms)
    .where(
      and(
        sql`${npsForms.sectionId} IN (${sectionIdList})`,
        isNull(npsForms.deletedAt),
        eq(npsForms.isActive, 1),
        eq(npsForms.status, 'PUBLISHED'),
        sql`(${npsForms.startsAt} IS NULL OR ${npsForms.startsAt} <= ${nowIst})`,
        sql`(${npsForms.endsAt}   IS NULL OR ${npsForms.endsAt}   >= ${nowIst})`,
      )
    )
    .orderBy(npsForms.startsAt, npsForms.createdAt)
  : []

  const npsFormIds = activeNpsForms.map((f) => f.id)
  const npsSubmitted = npsFormIds.length > 0
    ? await db
        .select({ npsFormId: npsSubmissions.npsFormId })
        .from(npsSubmissions)
        .where(
          and(
            eq(npsSubmissions.userId, userId),
            sql`${npsSubmissions.npsFormId} IN (${sql.raw(npsFormIds.join(', '))})`,
            eq(npsSubmissions.status, 'SUBMITTED'),
            isNull(npsSubmissions.deletedAt),
          )
        )
    : []
  const npsSubmittedIds = new Set(npsSubmitted.map((s) => s.npsFormId))

  const pendingNps: Array<PendingFeedbackForm> = activeNpsForms
    .filter((f) => !npsSubmittedIds.has(f.id))
    .map((f) => ({ id: f.id, title: f.title, source: 'nps' as const }))

  // ── assess_nps_form ────────────────────────────────────────────────────────
  const sectionOrBatchClause = ([] as Array<ReturnType<typeof sql>>).concat(
    sectionIdList ? [sql`${assessNpsForm.sectionId} IN (${sectionIdList})`] : [],
    batchIdList ? [sql`${assessNpsForm.batchId} IN (${batchIdList})`] : [],
  )

  const activeAssessForms = sectionOrBatchClause.length > 0 ? await db
    .select({ id: assessNpsForm.id, title: assessNpsForm.title, startsAt: assessNpsForm.startsAt, createdAt: assessNpsForm.createdAt })
    .from(assessNpsForm)
    .where(
      and(
        sql`(${sql.join(sectionOrBatchClause, sql` OR `)})`,
        isNull(assessNpsForm.deletedAt),
        sql`(${assessNpsForm.startsAt} IS NULL OR ${assessNpsForm.startsAt} <= ${nowIst})`,
        sql`(${assessNpsForm.endsAt}   IS NULL OR ${assessNpsForm.endsAt}   >= ${nowIst})`,
      )
    )
    .orderBy(assessNpsForm.startsAt, assessNpsForm.createdAt)
  : []

  const assessFormIds = activeAssessForms.map((f) => f.id)
  const assessSubmissions = assessFormIds.length > 0
    ? await db
        .select({
          npsFormId: assessNpsSubmissions.npsFormId,
          completedAt: assessNpsSubmissions.completedAt,
          assessCallback: assessNpsSubmissions.assessCallback,
        })
        .from(assessNpsSubmissions)
        .where(
          and(
            eq(assessNpsSubmissions.userId, userId),
            sql`${assessNpsSubmissions.npsFormId} IN (${sql.raw(assessFormIds.join(', '))})`,
          )
        )
    : []
  const assessSubmittedIds = new Set(
    assessSubmissions.filter(isAssessCompleted).map((s) => s.npsFormId)
  )

  const pendingAssess: Array<PendingFeedbackForm> = activeAssessForms
    .filter((f) => !assessSubmittedIds.has(f.id))
    .map((f) => ({ id: f.id, title: f.title, source: 'assess_nps' as const }))

  // Merge both sources, re-sort by starts_at ASC (nulls last), then created_at ASC
  return [...pendingNps, ...pendingAssess].sort((a, b) => {
    const aTime = (activeNpsForms.find((f) => f.id === a.id) ?? activeAssessForms.find((f) => f.id === a.id))?.startsAt ?? ''
    const bTime = (activeNpsForms.find((f) => f.id === b.id) ?? activeAssessForms.find((f) => f.id === b.id))?.startsAt ?? ''
    if (!aTime && !bTime) return 0
    if (!aTime) return 1
    if (!bTime) return -1
    return aTime.localeCompare(bTime)
  })
}

/**
 * Show Zoom banner when users.meta.isNolanAuthenticated is not strictly true.
 * Handles both boolean true and string "true" from JSON.
 */
async function checkZoomRequired(userId: number): Promise<boolean> {
  const rows = await db
    .select({ meta: users.meta })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const meta = rows[0]?.meta as Record<string, unknown> | null | undefined
  const val = meta?.['isNolanAuthenticated']
  return val !== true && val !== 'true'
}

/**
 * Show profile picture banner when profiles.meta.profile_pic is missing or not a valid URL.
 */
function parseMeta(raw: unknown): Record<string, unknown> {
  if (!raw) return {}
  if (typeof raw === 'object') return raw as Record<string, unknown>
  try { return JSON.parse(String(raw)) as Record<string, unknown> } catch { return {} }
}

async function checkProfilePictureRequired(userId: number): Promise<boolean> {
  const rows = await db
    .select({ meta: profiles.meta })
    .from(profiles)
    .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
    .limit(1)

  const meta = parseMeta(rows[0]?.meta)
  const pic = meta['profile_pic']
  if (!pic || typeof pic !== 'string' || pic.trim() === '') return true
  // Must be a valid http/https URL
  try {
    const url = new URL(pic.trim())
    return url.protocol !== 'http:' && url.protocol !== 'https:'
  } catch {
    return true
  }
}

/**
 * Show Download App banner when user has no rows in user_device_tokens.
 */
async function checkDownloadAppRequired(userId: number): Promise<boolean> {
  const rows = await db
    .select({ id: userDeviceTokens.id })
    .from(userDeviceTokens)
    .where(eq(userDeviceTokens.userId, userId))
    .limit(1)

  return rows.length === 0
}

export async function getDashboardActionBanners(
  userId: number,
): Promise<DashboardActionBannersResult> {
  const [pendingAgreementSections, pendingFeedbackForms, showZoom, showDownloadApp, showProfilePicture] = await Promise.all([
    checkAgreementRequired(userId),
    checkFeedbackPending(userId),
    checkZoomRequired(userId),
    checkDownloadAppRequired(userId),
    checkProfilePictureRequired(userId),
  ])

  return { pendingAgreementSections, pendingFeedbackForms, showZoom, showDownloadApp, showProfilePicture }
}
