import { describe, expect, it } from 'vitest'

import { admissionEventSchema } from '@/server/api/webhooks/admissions/events.schema'

function envelope(type: string, data: Record<string, unknown> = {}) {
  return {
    id: 1,
    type,
    created_at: '2026-01-01T10:00:00.000Z',
    data: { enrolment_id: 123, ...data },
  }
}

describe('admissionEventSchema', () => {
  it('accepts lms.batch.paid with just an enrolment_id', () => {
    expect(
      admissionEventSchema.safeParse(envelope('lms.batch.paid')).success,
    ).toBe(true)
  })

  it('accepts pause / unpause events', () => {
    expect(
      admissionEventSchema.safeParse(envelope('lms.batch.pause')).success,
    ).toBe(true)
    expect(
      admissionEventSchema.safeParse(envelope('lms.batch.unpause')).success,
    ).toBe(true)
  })

  it('accepts transfer events when to_batch_id is present', () => {
    const parsed = admissionEventSchema.safeParse(
      envelope('lms.batch.transfer.considered', { to_batch_id: 22 }),
    )
    expect(parsed.success).toBe(true)
  })

  it('rejects transfer events missing to_batch_id', () => {
    expect(
      admissionEventSchema.safeParse(envelope('lms.batch.transfer.rejected'))
        .success,
    ).toBe(false)
  })

  it('accepts lms.invoice.generated with full_fees_paid_invoice', () => {
    const parsed = admissionEventSchema.safeParse(
      envelope('lms.invoice.generated', {
        full_fees_paid_invoice: 'https://cdn/inv.pdf',
      }),
    )
    expect(parsed.success).toBe(true)
  })

  it('rejects lms.invoice.generated missing full_fees_paid_invoice', () => {
    expect(
      admissionEventSchema.safeParse(envelope('lms.invoice.generated')).success,
    ).toBe(false)
  })

  it('accepts lms.fee.deadline.updated with course_fee_deadline', () => {
    const parsed = admissionEventSchema.safeParse(
      envelope('lms.fee.deadline.updated', {
        course_fee_deadline: '2026-09-01 00:00:00',
      }),
    )
    expect(parsed.success).toBe(true)
  })

  it('rejects lms.fee.deadline.updated missing course_fee_deadline', () => {
    expect(
      admissionEventSchema.safeParse(envelope('lms.fee.deadline.updated'))
        .success,
    ).toBe(false)
  })

  it('treats null optional fields as absent, not invalid', () => {
    const parsed = admissionEventSchema.safeParse(
      envelope('lms.batch.paid', {
        full_fees_paid_invoice: null,
        course_fee_deadline: null,
        lms_batch_user_id: null,
      }),
    )
    expect(parsed.success).toBe(true)
  })

  it('accepts a real admissions lms.batch.paid envelope', () => {
    const parsed = admissionEventSchema.safeParse({
      type: 'lms.batch.paid',
      data: {
        batch_id: '350',
        username: 'iitreict_dsai_en_iii_2609545',
        lms_user_id: '10038053',
        enrolment_id: 385665,
        full_fees_paid: true,
        full_fees_amount: 57360,
        full_fees_paid_date: '2026-08-04 11:07:46',
        lms_enrolled_batch_id: 350,
        full_fees_paid_invoice: null,
        student_kit_tracking_URL: null,
        lms_admission_user_data_id: 12818,
        lms_enrolled_batch_user_id: 338327,
        student_kit_details_filled: false,
      },
    })
    expect(parsed.success).toBe(true)
  })

  it('still rejects lms.invoice.generated with a null invoice', () => {
    expect(
      admissionEventSchema.safeParse(
        envelope('lms.invoice.generated', { full_fees_paid_invoice: null }),
      ).success,
    ).toBe(false)
  })

  it('still rejects lms.fee.deadline.updated with a null deadline', () => {
    expect(
      admissionEventSchema.safeParse(
        envelope('lms.fee.deadline.updated', { course_fee_deadline: null }),
      ).success,
    ).toBe(false)
  })

  it('still rejects transfer events with a null to_batch_id', () => {
    expect(
      admissionEventSchema.safeParse(
        envelope('lms.batch.transfer.completed', { to_batch_id: null }),
      ).success,
    ).toBe(false)
  })

  it('rejects an unknown event type', () => {
    expect(
      admissionEventSchema.safeParse(envelope('lms.batch.exploded')).success,
    ).toBe(false)
  })

  it('rejects a missing enrolment_id', () => {
    const parsed = admissionEventSchema.safeParse({
      type: 'lms.batch.paid',
      data: {},
    })
    expect(parsed.success).toBe(false)
  })

  it('accepts and normalises data.client', () => {
    const parsed = admissionEventSchema.safeParse(
      envelope('lms.batch.paid', { client: ' IHub ' }),
    )
    expect(parsed.success && parsed.data.data.client).toBe('ihub')
  })

  it('accepts a null data.client as "not sent"', () => {
    const parsed = admissionEventSchema.safeParse(
      envelope('lms.batch.paid', { client: null }),
    )
    expect(parsed.success && parsed.data.data.client).toBe(null)
  })

  it('rejects an empty data.client string', () => {
    expect(
      admissionEventSchema.safeParse(envelope('lms.batch.paid', { client: '' }))
        .success,
    ).toBe(false)
  })

  it('keeps unknown envelope + data fields (passthrough)', () => {
    const parsed = admissionEventSchema.safeParse(
      envelope('lms.batch.paid', { from_batch_id: 10, requested_by: 'x@y.z' }),
    )
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.data.from_batch_id).toBe(10)
    }
  })
})
