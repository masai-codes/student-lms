import { sql } from 'drizzle-orm'
import { computeFeePaymentBanner } from './feePaymentBanner'
import type { FeePaymentBannerState } from './feePaymentBanner'
import { resolveCourseTitle } from '../courseTitle'
import { db } from '@/db'

/** A fee-payment banner for one batch (state + which course it's for). */
export type FeePaymentBanner = FeePaymentBannerState & {
  batchId: number
  courseTitle: string
}

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

/** Parse an IST wall-clock DATETIME string (`YYYY-MM-DD HH:MM:SS`) to an instant. */
function parseIstDatetime(value: unknown): Date | null {
  if (typeof value !== 'string' || value.trim() === '') return null
  const date = new Date(`${value.trim().replace(' ', 'T')}+05:30`)
  return Number.isNaN(date.getTime()) ? null : date
}

function httpUrlOrNull(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null
  try {
    const url = new URL(value.trim())
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

/** Overdue banners rank ahead of timers; timers rank by urgency (soonest first). */
function urgency(banner: FeePaymentBanner): number {
  return banner.type === 'overdue' ? -1 : banner.daysRemaining
}

interface AdmissionFeeRow {
  batch_id: number
  full_fees_paid: number | boolean
  course_fee_deadline: string | null
  payment_url: string | null
  batch_name: string | null
  batch_meta: unknown
}

/**
 * One fee-payment banner per partial-fee batch (timer before its
 * `course_fee_deadline`, overdue after), each tagged with the course name — the
 * dashboard renders these as a swipable carousel. Full-fee / non-T0 users have
 * no matching rows → `[]`. Sorted most-urgent first (overdue, then soonest timer).
 */
export async function getFeePaymentBanners(
  userId: number,
  now: Date = new Date(),
): Promise<Array<FeePaymentBanner>> {
  const rows = normalizeRows<AdmissionFeeRow>(
    await db.execute(sql`
      SELECT uba.batch_id, uba.full_fees_paid, uba.course_fee_deadline, uba.payment_url,
             b.name AS batch_name, b.meta AS batch_meta
      FROM user_batch_admission_data uba
      JOIN batches b ON b.id = uba.batch_id
      WHERE uba.user_id = ${userId}
    `)
  )

  const banners: Array<FeePaymentBanner> = []
  for (const row of rows) {
    if (row.full_fees_paid) continue
    const state = computeFeePaymentBanner({
      fullFeesPaid: false,
      courseFeeDeadline: parseIstDatetime(row.course_fee_deadline),
      paymentUrl: httpUrlOrNull(row.payment_url),
      now,
    })
    if (!state) continue
    const batchId = Number(row.batch_id)
    banners.push({ ...state, batchId, courseTitle: resolveCourseTitle(row.batch_meta, row.batch_name) || String(batchId) })
  }

  return banners.sort((a, b) => urgency(a) - urgency(b))
}
