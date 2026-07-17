/**
 * Fee-payment banner logic for a T0 + PARTIAL_FEES learner (has an admission
 * row, `full_fees_paid = false`). Pure + db-free so it can be unit-tested.
 *
 * The banner pivots solely on `course_fee_deadline`:
 * - **before** it  → `timer` banner counting the days remaining.
 * - **on/after** it → `overdue` banner counting the days overdue.
 */

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

/**
 * The per-batch banner state (before batch identity is attached). A `timer` with
 * more than a day left counts down in days (`hoursRemaining: null`); with under
 * a day left it counts down in hours (`daysRemaining: 0`).
 */
export type FeePaymentBannerState =
  | {
      type: 'timer'
      daysRemaining: number
      hoursRemaining: number | null
      paymentUrl: string | null
    }
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
export function computeFeePaymentBanner(
  input: FeePaymentBannerInput,
): FeePaymentBannerState | null {
  const { fullFeesPaid, courseFeeDeadline, paymentUrl, now } = input
  if (fullFeesPaid) return null
  if (!courseFeeDeadline) return null

  // Deadline passed → overdue, with a whole-day count of how long ago (min 1).
  if (now.getTime() >= courseFeeDeadline.getTime()) {
    const daysOverdue = Math.max(
      1,
      Math.ceil((now.getTime() - courseFeeDeadline.getTime()) / DAY_MS),
    )
    return { type: 'overdue', daysOverdue, paymentUrl }
  }

  // Still before the deadline → timer. Count down in days while a full day or
  // more remains, otherwise switch to an hour countdown (min 1) for urgency.
  const remainingMs = courseFeeDeadline.getTime() - now.getTime()
  if (remainingMs >= DAY_MS) {
    return {
      type: 'timer',
      daysRemaining: Math.ceil(remainingMs / DAY_MS),
      hoursRemaining: null,
      paymentUrl,
    }
  }
  return {
    type: 'timer',
    daysRemaining: 0,
    hoursRemaining: Math.max(1, Math.ceil(remainingMs / HOUR_MS)),
    paymentUrl,
  }
}
