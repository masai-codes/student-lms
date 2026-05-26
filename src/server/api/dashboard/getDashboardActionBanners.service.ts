import { and, eq, isNull, sql } from 'drizzle-orm'
import { db } from '@/db'
import { profiles, sectionUser, users } from '@/db/schema'

export interface DashboardActionBannersResult {
  showAgreement: boolean
  showFeedback: boolean
  showZoom: boolean
}

function normalizeRows(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<Record<string, unknown>>
    return result as Array<Record<string, unknown>>
  }
  if (
    result &&
    typeof result === 'object' &&
    'rows' in result &&
    Array.isArray(result.rows)
  ) {
    return (result as { rows: Array<Record<string, unknown>> }).rows
  }
  return []
}

/**
 * Show the agreement slide only when the user's profile has a non-empty
 * agreementPdfUrl in the legal_data JSON column.
 */
async function checkAgreementRequired(userId: number): Promise<boolean> {
  const rows = await db
    .select({ legalData: profiles.legalData })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1)

  const legalData = rows[0]?.legalData as Record<string, unknown> | null | undefined
  const url = legalData?.['agreementPdfUrl']
  return typeof url === 'string' && url.trim().length > 0
}

/**
 * Show the feedback slide only when:
 *  - There is at least one active NPS form (PUBLISHED, is_active=1,
 *    starts_at < NOW < ends_at) for any section the user belongs to
 *  - AND the user has no submission (non-deleted) for that form
 */
async function checkFeedbackPending(userId: number): Promise<boolean> {
  const sectionRows = await db
    .select({ sectionId: sectionUser.sectionId })
    .from(sectionUser)
    .where(
      and(
        eq(sectionUser.userId, userId),
        isNull(sectionUser.deletedAt),
      ),
    )

  if (sectionRows.length === 0) return false

  const sectionIds = [...new Set(sectionRows.map((r) => r.sectionId))]
    .filter(Number.isFinite)

  if (sectionIds.length === 0) return false

  // sectionIds come from our own DB query — safe to inline
  const sectionIdList = sectionIds.join(', ')

  const result = await db.execute(sql`
    SELECT 1
    FROM nps_forms nf
    WHERE nf.section_id IN (${sql.raw(sectionIdList)})
      AND nf.starts_at < NOW()
      AND nf.ends_at   > NOW()
      AND nf.status     = 'PUBLISHED'
      AND nf.is_active  = 1
      AND nf.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1
        FROM nps_submissions ns
        WHERE ns.nps_form_id = nf.id
          AND ns.user_id     = ${userId}
          AND ns.deleted_at  IS NULL
      )
    LIMIT 1
  `)

  return normalizeRows(result).length > 0
}

/**
 * Show the Zoom slide only when users.meta.isNolanAuthenticated is NOT true
 * (missing, null, or explicitly false).
 */
async function checkZoomRequired(userId: number): Promise<boolean> {
  const rows = await db
    .select({ meta: users.meta })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const meta = rows[0]?.meta as Record<string, unknown> | null | undefined
  return meta?.['isNolanAuthenticated'] !== true
}

export async function getDashboardActionBanners(
  userId: number,
): Promise<DashboardActionBannersResult> {
  const [showAgreement, showFeedback, showZoom] = await Promise.all([
    checkAgreementRequired(userId),
    checkFeedbackPending(userId),
    checkZoomRequired(userId),
  ])

  return { showAgreement, showFeedback, showZoom }
}
