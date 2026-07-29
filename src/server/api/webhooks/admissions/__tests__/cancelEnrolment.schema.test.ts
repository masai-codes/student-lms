import { describe, expect, it } from 'vitest'

import { cancelEnrolmentSchema } from '@/server/api/webhooks/admissions/cancelEnrolment.schema'

describe('cancelEnrolmentSchema', () => {
  it('accepts a positive integer enrolment_id', () => {
    const parsed = cancelEnrolmentSchema.safeParse({
      enrolment_id: 314294967295,
    })
    expect(parsed.success).toBe(true)
  })

  it('rejects a missing enrolment_id', () => {
    expect(cancelEnrolmentSchema.safeParse({}).success).toBe(false)
  })

  it('rejects a non-positive enrolment_id', () => {
    expect(cancelEnrolmentSchema.safeParse({ enrolment_id: 0 }).success).toBe(
      false,
    )
  })

  it('rejects a non-integer enrolment_id', () => {
    expect(cancelEnrolmentSchema.safeParse({ enrolment_id: 1.5 }).success).toBe(
      false,
    )
  })
})
