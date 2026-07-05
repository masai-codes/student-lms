import { describe, expect, it } from 'vitest'
import { computeFeePaymentBanner } from '../feePaymentBanner'

const day = (iso: string) => new Date(iso)
const DAY_MS = 24 * 60 * 60 * 1000

describe('computeFeePaymentBanner', () => {
  const base = {
    fullFeesPaid: false as const,
    courseFeeDeadline: day('2026-07-15T00:00:00Z') as Date | null,
    paymentUrl: 'https://pay.test/x',
  }

  it('returns null for full-fee learners', () => {
    expect(computeFeePaymentBanner({ ...base, fullFeesPaid: true, now: day('2026-07-05T00:00:00Z') })).toBeNull()
  })

  it('returns null when there is no course_fee_deadline', () => {
    expect(
      computeFeePaymentBanner({ ...base, courseFeeDeadline: null, now: day('2026-07-05T00:00:00Z') }),
    ).toBeNull()
  })

  it('shows a timer banner with a whole-day countdown before the deadline', () => {
    // deadline 07-15, now 07-08 → 7 days remaining
    const banner = computeFeePaymentBanner({ ...base, now: day('2026-07-08T00:00:00Z') })
    expect(banner).toEqual({ type: 'timer', daysRemaining: 7, paymentUrl: 'https://pay.test/x' })
  })

  it('rounds partial days up and never below 1', () => {
    // 12 hours before the deadline → still "1 day remaining"
    const banner = computeFeePaymentBanner({
      ...base,
      now: new Date(day('2026-07-15T00:00:00Z').getTime() - DAY_MS / 2),
    })
    expect(banner).toEqual({ type: 'timer', daysRemaining: 1, paymentUrl: 'https://pay.test/x' })
  })

  it('shows the overdue banner with a days-overdue count once the deadline has passed', () => {
    // deadline 07-15, now 07-18 → 3 days overdue
    const banner = computeFeePaymentBanner({ ...base, now: day('2026-07-18T00:00:00Z') })
    expect(banner).toEqual({ type: 'overdue', daysOverdue: 3, paymentUrl: 'https://pay.test/x' })
  })

  it('treats the exact deadline instant as overdue (min 1 day)', () => {
    const banner = computeFeePaymentBanner({ ...base, now: day('2026-07-15T00:00:00Z') })
    expect(banner).toEqual({ type: 'overdue', daysOverdue: 1, paymentUrl: 'https://pay.test/x' })
  })
})
