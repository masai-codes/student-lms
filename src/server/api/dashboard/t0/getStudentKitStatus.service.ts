import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { buildAdmissionsRedirectForUser } from '@/server/admissions/buildAdmissionsRedirectForUser'

export interface StudentKitStatus {
  /** Whether this student is due a welcome kit (`student_kit_exists`). */
  applicable: boolean
  /** Whether the student has submitted shipping details. */
  detailsFilled: boolean
  /** Courier tracking URL once the kit ships. */
  trackingUrl: string | null
  /** Tracking id — currently unavailable from admissions (surfaced as null). */
  trackingId: string | null
  /** SSO link to the admissions form to fill shipping details (only when not filled). */
  admissionsFormUrl: string | null
}

const EMPTY: StudentKitStatus = {
  applicable: false,
  detailsFilled: false,
  trackingUrl: null,
  trackingId: null,
  admissionsFormUrl: null,
}

function normalizeRows<T>(result: unknown): Array<T> {
  if (Array.isArray(result)) return (Array.isArray(result[0]) ? result[0] : result) as Array<T>
  if (result && typeof result === 'object' && 'rows' in result) return (result as { rows: Array<T> }).rows
  return []
}

/**
 * Student-kit status derived entirely from the admission row (the four states:
 * not-applicable → details-not-filled → filled-pending-tracking → tracking).
 * When details aren't filled yet, includes an admissions SSO link to fill them.
 * `user_batch_admission_data` isn't in the Drizzle builder schema, so it's read
 * via raw SQL (as the other T0 services do).
 */
export async function getStudentKitStatus(userId: number, batchId: number): Promise<StudentKitStatus> {
  const [row] = normalizeRows<{
    student_kit_exists: number | boolean
    student_kit_details_filled: number | boolean
    student_kit_tracking_url: string | null
    payment_url: string | null
  }>(
    await db.execute(sql`
      SELECT student_kit_exists, student_kit_details_filled, student_kit_tracking_url, payment_url
      FROM user_batch_admission_data
      WHERE user_id = ${userId} AND batch_id = ${batchId}
      LIMIT 1
    `),
  )

  if (!row || !row.student_kit_exists) return EMPTY

  const detailsFilled = Boolean(row.student_kit_details_filled)
  const trackingUrl = row.student_kit_tracking_url?.trim() || null

  let admissionsFormUrl: string | null = null
  if (!detailsFilled) {
    const redirect = row.payment_url?.trim() || process.env.ADMISSIONS_SSO_BASE_URL || ''
    admissionsFormUrl = await buildAdmissionsRedirectForUser(userId, redirect)
  }

  return { applicable: true, detailsFilled, trackingUrl, trackingId: null, admissionsFormUrl }
}
