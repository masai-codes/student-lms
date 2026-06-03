import { and, eq, isNull, sql } from 'drizzle-orm'
import { db } from '@/db'
import { profiles, sectionUser, users, userDeviceTokens } from '@/db/schema'

export interface DashboardActionBannersResult {
  showAgreement: boolean
  showFeedback: boolean
  showZoom: boolean
  showDownloadApp: boolean
}

function normalizeRows(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<Record<string, unknown>>
    return result as Array<Record<string, unknown>>
  }
  if (result && typeof result === 'object' && 'rows' in result && Array.isArray((result as { rows: unknown }).rows)) {
    return (result as { rows: Array<Record<string, unknown>> }).rows
  }
  return []
}

/**
 * Show agreement banner when:
 * - User is enrolled in a section (section_user, not deleted)
 * - That section is active and has settings.agreements.shouldModalBeVisible = true
 *   with a valid heading + pdfUrl, and hidePolicy != true
 * - User's profile legal_data does NOT have haveAcceptedLegalAgreement = true
 *   for that section
 */
async function checkAgreementRequired(userId: number): Promise<boolean> {
  const sectionRows = await db
    .select({ sectionId: sectionUser.sectionId })
    .from(sectionUser)
    .where(and(eq(sectionUser.userId, userId), isNull(sectionUser.deletedAt)))

  if (sectionRows.length === 0) return false

  const sectionIds = [...new Set(sectionRows.map((r) => r.sectionId))].filter(Number.isFinite)
  if (sectionIds.length === 0) return false

  const sectionIdList = sectionIds.join(', ')

  // Find sections that require agreement
  const sectionResult = normalizeRows(
    await db.execute(sql`
      SELECT id
      FROM sections
      WHERE id IN (${sql.raw(sectionIdList)})
        AND active = 1
        AND settings->>'$.agreements.shouldModalBeVisible' = 'true'
        AND settings->>'$.agreements.pdfUrl' IS NOT NULL
        AND settings->>'$.agreements.pdfUrl' != ''
        AND settings->>'$.agreements.heading' IS NOT NULL
        AND settings->>'$.agreements.heading' != ''
        AND (settings->>'$.agreements.hidePolicy' IS NULL OR settings->>'$.agreements.hidePolicy' != 'true')
    `)
  )

  if (sectionResult.length === 0) return false

  // Check if user has already accepted all agreements
  const profileRows = await db
    .select({ legalData: profiles.legalData })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1)

  const legalData = profileRows[0]?.legalData as Record<string, unknown> | null | undefined
  const agreements = (legalData?.['agreements'] ?? {}) as Record<string, unknown>

  // Show if any required section has NOT been accepted
  return sectionResult.some((row) => {
    const sectionId = Number(row.id)
    const sectionKey = `section_${sectionId}`
    const sectionAgreement = agreements[sectionKey] as Record<string, unknown> | undefined
    return sectionAgreement?.['haveAcceptedLegalAgreement'] !== true
  })
}

/**
 * Show feedback banner when:
 * - User has a lecture in an enrolled section scheduled within the last 7 days
 * - That lecture has a feedback_id linked to an active feedback window
 * - User has no response for that feedback
 */
async function checkFeedbackPending(userId: number): Promise<boolean> {
  const sectionRows = await db
    .select({ sectionId: sectionUser.sectionId })
    .from(sectionUser)
    .where(and(eq(sectionUser.userId, userId), isNull(sectionUser.deletedAt)))

  if (sectionRows.length === 0) return false

  const sectionIds = [...new Set(sectionRows.map((r) => r.sectionId))].filter(Number.isFinite)
  if (sectionIds.length === 0) return false

  const sectionIdList = sectionIds.join(', ')

  const result = normalizeRows(
    await db.execute(sql`
      SELECT 1
      FROM lectures l
      INNER JOIN feedback f ON f.id = l.feedback_id
      WHERE l.section_id IN (${sql.raw(sectionIdList)})
        AND l.deleted_at IS NULL
        AND l.feedback_id IS NOT NULL
        AND l.schedule >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND l.schedule <= NOW()
        AND f.start_time <= NOW()
        AND f.end_time   >= NOW()
        AND NOT EXISTS (
          SELECT 1
          FROM feedback_responses fr
          WHERE fr.feedback_id = f.id
            AND fr.user_id     = ${userId}
        )
      LIMIT 1
    `)
  )

  return result.length > 0
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
  const [showAgreement, showFeedback, showZoom, showDownloadApp] = await Promise.all([
    checkAgreementRequired(userId),
    checkFeedbackPending(userId),
    checkZoomRequired(userId),
    checkDownloadAppRequired(userId),
  ])

  return { showAgreement, showFeedback, showZoom, showDownloadApp }
}
