import { describe, expect, it } from 'vitest'

import { batchTransferSchema } from '@/server/api/webhooks/admissions/batchTransfer.schema'
import { fullPaymentReceivedSchema } from '@/server/api/webhooks/admissions/fullPaymentReceived.schema'
import { pauseBatchSchema } from '@/server/api/webhooks/admissions/pauseBatch.schema'

describe('fullPaymentReceivedSchema', () => {
  it('accepts a valid payload', () => {
    expect(
      fullPaymentReceivedSchema.safeParse({
        enrolment_id: 999,
        full_fees_paid: true,
      }).success,
    ).toBe(true)
  })

  it('requires full_fees_paid', () => {
    expect(
      fullPaymentReceivedSchema.safeParse({ enrolment_id: 999 }).success,
    ).toBe(false)
  })

  it('rejects a non-boolean full_fees_paid', () => {
    expect(
      fullPaymentReceivedSchema.safeParse({
        enrolment_id: 999,
        full_fees_paid: 'yes',
      }).success,
    ).toBe(false)
  })
})

describe('batchTransferSchema', () => {
  it('accepts a valid payload', () => {
    expect(
      batchTransferSchema.safeParse({
        enrolment_id: 999,
        batch_transfer_id: 12345,
      }).success,
    ).toBe(true)
  })

  it('requires batch_transfer_id', () => {
    expect(batchTransferSchema.safeParse({ enrolment_id: 999 }).success).toBe(
      false,
    )
  })
})

describe('pauseBatchSchema', () => {
  it('accepts a valid payload', () => {
    expect(pauseBatchSchema.safeParse({ enrolment_id: 999 }).success).toBe(true)
  })

  it('rejects a missing enrolment_id', () => {
    expect(pauseBatchSchema.safeParse({}).success).toBe(false)
  })
})
