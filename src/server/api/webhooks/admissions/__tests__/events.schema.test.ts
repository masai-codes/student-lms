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
