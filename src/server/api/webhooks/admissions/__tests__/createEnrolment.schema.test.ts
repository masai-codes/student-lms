import { describe, expect, it } from 'vitest'

import { createEnrolmentSchema } from '@/server/api/webhooks/admissions/createEnrolment.schema'

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Asha Rao',
    email: 'Asha.Rao@Example.com',
    password: 'secret-pass',
    mobile: '9998887776',
    username: 'asha_rao',
    section_ids: [1, 2],
    batch_id: 10,
    enrolment_id: 987654321,
    ...overrides,
  }
}

describe('createEnrolmentSchema', () => {
  it('accepts a valid minimal payload and lowercases the email', () => {
    const parsed = createEnrolmentSchema.safeParse(validPayload())
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.email).toBe('asha.rao@example.com')
    }
  })

  it('rejects a malformed email', () => {
    const parsed = createEnrolmentSchema.safeParse(
      validPayload({ email: 'not-an-email' }),
    )
    expect(parsed.success).toBe(false)
  })

  it('rejects an empty section_ids array', () => {
    const parsed = createEnrolmentSchema.safeParse(
      validPayload({ section_ids: [] }),
    )
    expect(parsed.success).toBe(false)
  })

  it('rejects a missing mandatory field', () => {
    const payload = validPayload()
    delete (payload as Record<string, unknown>).username
    expect(createEnrolmentSchema.safeParse(payload).success).toBe(false)
  })

  it('rejects a missing enrolment_id', () => {
    const payload = validPayload()
    delete (payload as Record<string, unknown>).enrolment_id
    expect(createEnrolmentSchema.safeParse(payload).success).toBe(false)
  })

  it('requires course_fee_deadline when new_user_journey is true', () => {
    const parsed = createEnrolmentSchema.safeParse(
      validPayload({ new_user_journey: true }),
    )
    expect(parsed.success).toBe(false)
  })

  it('accepts new_user_journey with a course_fee_deadline', () => {
    const parsed = createEnrolmentSchema.safeParse(
      validPayload({
        new_user_journey: true,
        course_fee_deadline: '2026-09-01 00:00:00',
      }),
    )
    expect(parsed.success).toBe(true)
  })

  it('does not require course_fee_deadline when new_user_journey is false', () => {
    const parsed = createEnrolmentSchema.safeParse(
      validPayload({ new_user_journey: false }),
    )
    expect(parsed.success).toBe(true)
  })

  it('treats null optional fields as absent, not invalid', () => {
    const parsed = createEnrolmentSchema.safeParse(
      validPayload({
        manager_id: null,
        new_user_journey: null,
        id_card_url: null,
        seat_blocking_fees_paid: null,
        seat_blocking_fees_amount: null,
        seat_blocking_fees_paid_date: null,
        seat_blocking_fees_invoice: null,
        student_kit_exists: null,
        course_fee_deadline: null,
        payment_url: null,
        isiHub: null,
        isiitj: null,
      }),
    )
    expect(parsed.success).toBe(true)
  })

  it('still requires a real course_fee_deadline on a new user journey', () => {
    const parsed = createEnrolmentSchema.safeParse(
      validPayload({ new_user_journey: true, course_fee_deadline: null }),
    )
    expect(parsed.success).toBe(false)
  })
})
