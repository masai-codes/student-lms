import { describe, expect, it } from 'vitest'

import { cancelEnrolmentSchema } from '@/server/api/webhooks/admissions/cancelEnrolment.schema'
import { undoCancelEnrolmentSchema } from '@/server/api/webhooks/admissions/undoCancelEnrolment.schema'

describe('undoCancelEnrolmentSchema', () => {
  it('is the cancel payload shape, so the two can never drift apart', () => {
    expect(undoCancelEnrolmentSchema).toBe(cancelEnrolmentSchema)
  })

  it('accepts enrolment_id with the optional client + batch_id scopes', () => {
    const parsed = undoCancelEnrolmentSchema.safeParse({
      enrolment_id: 123,
      client: ' IITJ ',
      batch_id: 10,
    })
    expect(parsed.success && parsed.data).toEqual({
      enrolment_id: 123,
      client: 'iitj',
      batch_id: 10,
    })
  })

  it('rejects a missing enrolment_id', () => {
    expect(undoCancelEnrolmentSchema.safeParse({}).success).toBe(false)
  })
})
