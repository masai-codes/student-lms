import { and, eq, isNotNull, isNull } from 'drizzle-orm'

import { resolveCourseTitle } from './courseTitle'
import { db } from '@/db'
import { batchUser, batches } from '@/db/schema'
import { getAdmissionsSsoTokenForUser } from '@/server/admissions/getAdmissionsSsoTokenForUser'
import { BATCH_TRANSFER_STATUS } from '@/server/api/webhooks/admissions/types'

/** A "complete your batch-transfer payment" banner for one transfer request. */
export interface BatchTransferPaymentBanner {
  /** batch_user row id — carousel key + testid suffix. */
  batchUserId: number
  /** batch_transfer_id — the batch the learner is transferring to. */
  toBatchId: number
  /** Course title of the target batch (falls back to its id). */
  courseTitle: string
  /** Admissions CTA URL, or null when SSO isn't configured (CTA disabled). */
  paymentUrl: string | null
}

/**
 * Banners for the user's batches whose transfer request is awaiting payment.
 * A batch qualifies when it has a live `batch_user` row (`deleted_at IS NULL`)
 * with `batch_transfer_status = 'considered'`, a non-null `batch_transfer_id`
 * (the target batch) AND a non-null `enrolment_id` (needed for the CTA). One
 * banner per qualifying `batch_user` row; `[]` when none qualify.
 */
export async function getBatchTransferPaymentBanners(
  userId: number,
): Promise<Array<BatchTransferPaymentBanner>> {
  const rows = await db
    .select({
      batchUserId: batchUser.id,
      toBatchId: batchUser.batchTransferId,
      enrolmentId: batchUser.enrolmentId,
      batchName: batches.name,
      batchMeta: batches.meta,
    })
    .from(batchUser)
    // Target batch (batch_transfer_id) supplies the course title; left join so a
    // missing/deleted target batch still shows (title falls back to the id).
    .leftJoin(batches, eq(batches.id, batchUser.batchTransferId))
    .where(
      and(
        eq(batchUser.userId, userId),
        isNull(batchUser.deletedAt),
        eq(batchUser.batchTransferStatus, BATCH_TRANSFER_STATUS.CONSIDERED),
        isNotNull(batchUser.batchTransferId),
        isNotNull(batchUser.enrolmentId),
      ),
    )

  if (rows.length === 0) return []

  // One SSO token per user, reused across their transfer banners.
  const base = process.env.ADMISSIONS_SSO_BASE_URL?.trim().replace(/\/$/, '')
  const token = base ? await getAdmissionsSsoTokenForUser(userId) : null

  const banners: Array<BatchTransferPaymentBanner> = []
  for (const row of rows) {
    // Guaranteed non-null by the isNotNull filters; the checks also narrow types.
    if (row.toBatchId == null || row.enrolmentId == null) continue
    // Admissions treats an /lms-login request with `enrolment_id` present as an
    // enrolment payment (the SSO endpoint verifies the token + logs the user in).
    const paymentUrl =
      base && token
        ? `${base}/lms-login?token=${token}&enrolment_id=${row.enrolmentId}`
        : null
    banners.push({
      batchUserId: row.batchUserId,
      toBatchId: row.toBatchId,
      courseTitle:
        resolveCourseTitle(row.batchMeta, row.batchName) ||
        String(row.toBatchId),
      paymentUrl,
    })
  }

  return banners
}
