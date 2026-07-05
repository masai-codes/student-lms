/**
 * Fee-payment banner logic for a T0 + PARTIAL_FEES learner (has an admission
 * row, `full_fees_paid = false`). Pure + db-free so it can be unit-tested.
 *
 * The banner pivots solely on `course_fee_deadline`:
 * - **before** it  → `timer` banner counting the days remaining.
 * - **on/after** it → `overdue` banner counting the days overdue.
 */

const DAY_MS = 24 * 60 * 60 * 1000

/** The per-batch banner state (before batch identity is attached). */
export type FeePaymentBannerState =
  | { type: 'timer'; daysRemaining: number; paymentUrl: string | null }
  | { type: 'overdue'; daysOverdue: number; paymentUrl: string | null }

export interface FeePaymentBannerInput {
  fullFeesPaid: boolean
  /** `course_fee_deadline` as an instant (null when unset). */
  courseFeeDeadline: Date | null
  /** Where the "Unlock Full Access" CTA sends the learner. */
  paymentUrl: string | null
  now: Date
}

/**
 * Which fee-payment banner (if any) a partial-fee learner should see. Returns
 * `null` for full-fee learners or when there's no `course_fee_deadline`.
 */
export function computeFeePaymentBanner(input: FeePaymentBannerInput): FeePaymentBannerState | null {
  const { fullFeesPaid, courseFeeDeadline, paymentUrl, now } = input
  if (fullFeesPaid) return null
  if (!courseFeeDeadline) return null

  // Deadline passed → overdue, with a whole-day count of how long ago (min 1).
  if (now.getTime() >= courseFeeDeadline.getTime()) {
    const daysOverdue = Math.max(1, Math.ceil((now.getTime() - courseFeeDeadline.getTime()) / DAY_MS))
    return { type: 'overdue', daysOverdue, paymentUrl }
  }

  // Still before the deadline → timer with a whole-day countdown (min 1).
  const daysRemaining = Math.max(1, Math.ceil((courseFeeDeadline.getTime() - now.getTime()) / DAY_MS))
  return { type: 'timer', daysRemaining, paymentUrl }
}
