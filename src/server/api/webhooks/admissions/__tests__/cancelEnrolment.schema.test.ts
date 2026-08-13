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

  it('accepts and normalises a client', () => {
    const parsed = cancelEnrolmentSchema.safeParse({
      enrolment_id: 123,
      client: ' IITJ ',
    })
    expect(parsed.success && parsed.data.client).toBe('iitj')
  })

  it('accepts a null client as "not sent"', () => {
    const parsed = cancelEnrolmentSchema.safeParse({
      enrolment_id: 123,
      client: null,
    })
    expect(parsed.success && parsed.data.client).toBe(null)
  })

  it('accepts an unknown client verbatim (it just matches no student)', () => {
    const parsed = cancelEnrolmentSchema.safeParse({
      enrolment_id: 123,
      client: 'brand-new-portal',
    })
    expect(parsed.success && parsed.data.client).toBe('brand-new-portal')
  })

  it('rejects an empty client string', () => {
    expect(
      cancelEnrolmentSchema.safeParse({ enrolment_id: 123, client: '  ' })
        .success,
    ).toBe(false)
  })
})
