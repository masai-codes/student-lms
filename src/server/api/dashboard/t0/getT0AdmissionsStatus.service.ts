import { eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'
import { buildAdmissionsRedirectForUser } from '@/server/admissions/buildAdmissionsRedirectForUser'
import { getAdmissionsStudentStatus } from '@/server/admissions/getAdmissionsStudentStatus'
import type { AdmissionsStudentStatus } from '@/server/admissions/getAdmissionsStudentStatus'

/**
 * The single source of truth for the T0 document / student-kit / ID-card steps.
 *
 * Visibility ("is document upload needed?", "is a kit due?") and state
 * (uploaded / details-filled / tracking / ID card) are decided **solely** by the
 * admissions `student-status` API — no `batch_info` or DB-derived heuristics. The
 * latest raw response is then **dumped** into
 * `user_batch_admission_data.meta.admissionResponse` so our DB keeps the newest
 * snapshot, while the API stays the source of truth for what we send the frontend.
 *
 * Degrades gracefully: if the API is unconfigured/unreachable it returns an empty
 * status (steps hidden) but still hands back the SSO redirect link so any
 * already-visible redirect keeps working.
 */
export interface T0AdmissionsStatus {
  /** Show the Upload Document step (admissions `documents.required`). */
  documentsRequired: boolean
  documentsUploaded: boolean
  documentsVerified: boolean
  /** Show the Track Student Kit step (admissions `kit.showKit`). */
  kitApplicable: boolean
  kitDetailsFilled: boolean
  trackingUrl: string | null
  trackingId: string | null
  idCardUrl: string | null
  /** SSO deep-link to the admissions portal (serves both doc upload + kit form). */
  admissionsFormUrl: string | null
}

export const EMPTY_T0_ADMISSIONS_STATUS: T0AdmissionsStatus = {
  documentsRequired: false,
  documentsUploaded: false,
  documentsVerified: false,
  kitApplicable: false,
  kitDetailsFilled: false,
  trackingUrl: null,
  trackingId: null,
  idCardUrl: null,
  admissionsFormUrl: null,
}

function normalizeRows<T>(result: unknown): Array<T> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<T>
    return result as Array<T>
  }
  if (
    result &&
    typeof result === 'object' &&
    'rows' in result &&
    Array.isArray(result.rows)
  ) {
    return (result as { rows: Array<T> }).rows
  }
  return []
}

function httpUrlOrNull(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null
  try {
    const u = new URL(value.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
      ? u.toString()
      : null
  } catch {
    return null
  }
}

/**
 * Dump the latest raw admissions `student-status` response into
 * `user_batch_admission_data.meta.admissionResponse` (best-effort; never blocks
 * the read). The API stays the source of truth for everything we send to the
 * frontend — our DB just keeps the latest snapshot. `JSON_SET` merges the key in
 * place so the sibling progress fractions (`lms_walkthrough`, …) are preserved.
 */
async function dumpAdmissionResponse(
  userId: number,
  batchId: number,
  raw: AdmissionsStudentStatus,
): Promise<void> {
  try {
    const json = JSON.stringify(raw)
    await db.execute(sql`
      UPDATE user_batch_admission_data
      SET meta = JSON_SET(COALESCE(meta, JSON_OBJECT()), '$.admissionResponse', CAST(${json} AS JSON))
      WHERE user_id = ${userId} AND batch_id = ${batchId}
    `)
    console.log(
      '[student-status] dumped raw response into meta.admissionResponse',
      { userId, batchId },
    )
  } catch (error) {
    // The dump is a mirror — a failed write must not break the flow.
    console.error(
      '[student-status] failed to dump response into meta',
      { userId, batchId },
      error,
    )
  }
}

export async function getT0AdmissionsStatus(
  userId: number,
  batchId: number,
): Promise<T0AdmissionsStatus> {
  console.log('[student-status] getT0AdmissionsStatus called', {
    userId,
    batchId,
  })
  const [[user], admissionRows] = await Promise.all([
    db
      .select({ username: users.username })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
    normalizeRows<{ payment_url: string | null }>(
      await db.execute(sql`
        SELECT payment_url FROM user_batch_admission_data
        WHERE user_id = ${userId} AND batch_id = ${batchId} LIMIT 1
      `),
    ),
  ])

  const username = user?.username ?? ''
  const redirect =
    admissionRows[0]?.payment_url?.trim() ||
    process.env.ADMISSIONS_SSO_BASE_URL ||
    ''
  // Built regardless of the status call so the redirect works even if the API is down.
  const admissionsFormUrl = await buildAdmissionsRedirectForUser(
    userId,
    redirect,
  )

  console.log('[student-status] resolved studentCode (username) for user', {
    userId,
    batchId,
    username,
  })
  const status = await getAdmissionsStudentStatus(
    username,
    'documents,kit,id_card',
  )
  if (!status) {
    console.log('[student-status] no status returned — using EMPTY status', {
      userId,
      batchId,
      username,
    })
    return { ...EMPTY_T0_ADMISSIONS_STATUS, admissionsFormUrl }
  }
  console.log('[student-status] derived T0 flags from response', {
    userId,
    batchId,
    documentsRequired: status.documents?.required === true,
    documentsUploaded: status.documents?.documentsUploaded === true,
    kitApplicable: status.kit?.showKit === true,
    idCardUrl: status.idCard?.url ?? null,
  })

  const documentsRequired = status.documents?.required === true
  const documentsUploaded = status.documents?.documentsUploaded === true
  const documentsVerified = status.documents?.documentsVerified === true
  const kitApplicable = status.kit?.showKit === true
  const kitDetailsFilled = status.kit?.detailsFilled === true
  const trackingUrl = status.kit?.tracking?.trackingUrl?.trim() || null
  const trackingId = status.kit?.tracking?.trackingId?.trim() || null
  const idCardUrl = httpUrlOrNull(status.idCard?.url)

  // Mirror the latest raw response into our DB; the API remains the source of truth.
  await dumpAdmissionResponse(userId, batchId, status)

  return {
    documentsRequired,
    documentsUploaded,
    documentsVerified,
    kitApplicable,
    kitDetailsFilled,
    trackingUrl,
    trackingId,
    idCardUrl,
    admissionsFormUrl,
  }
}
