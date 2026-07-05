import { eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'
import { buildAdmissionsRedirectForUser } from '@/server/admissions/buildAdmissionsRedirectForUser'
import { getAdmissionsStudentStatus } from '@/server/admissions/getAdmissionsStudentStatus'

export interface T0FlowDocumentsStatus {
  /** Uploaded to the admissions portal (external system of record). */
  documentsUploaded: boolean
  documentsVerified: boolean
  /** SSO link to the admissions portal to upload documents. */
  admissionsFormUrl: string | null
}

function normalizeRows<T>(result: unknown): Array<T> {
  if (Array.isArray(result)) return (Array.isArray(result[0]) ? result[0] : result) as Array<T>
  if (result && typeof result === 'object' && 'rows' in result) return (result as { rows: Array<T> }).rows
  return []
}

/**
 * Document-upload status for the guided tour — fetched on demand (not in the
 * overview) because it hits the external admissions API. Upload/verification
 * state comes from admissions (the LMS doesn't store it); the SSO upload link is
 * always built so the redirect works even when the status API is unconfigured.
 */
export async function getT0FlowDocuments(userId: number, batchId: number): Promise<T0FlowDocumentsStatus> {
  const [[user], admissionRows] = await Promise.all([
    db.select({ username: users.username }).from(users).where(eq(users.id, userId)).limit(1),
    normalizeRows<{ payment_url: string | null }>(
      await db.execute(sql`
        SELECT payment_url FROM user_batch_admission_data
        WHERE user_id = ${userId} AND batch_id = ${batchId} LIMIT 1
      `),
    ),
  ])

  const status = await getAdmissionsStudentStatus(user?.username ?? '', 'documents')
  const redirect = admissionRows[0]?.payment_url?.trim() || process.env.ADMISSIONS_SSO_BASE_URL || ''

  return {
    documentsUploaded: status?.documents?.documentsUploaded === true,
    documentsVerified: status?.documents?.documentsVerified === true,
    admissionsFormUrl: await buildAdmissionsRedirectForUser(userId, redirect),
  }
}
