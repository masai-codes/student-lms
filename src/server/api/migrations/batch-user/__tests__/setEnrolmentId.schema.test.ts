import { describe, expect, it } from 'vitest'

import { setBatchUserEnrolmentIdSchema } from '@/server/api/migrations/batch-user/setEnrolmentId.schema'

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    batch_id: 350,
    user_id: 10038053,
    enrolment_id: 385665,
    ...overrides,
  }
}

describe('setBatchUserEnrolmentIdSchema', () => {
  it('defaults overwrite to false when omitted', () => {
    const parsed = setBatchUserEnrolmentIdSchema.safeParse(validPayload())
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data.overwrite).toBe(false)
  })

  it('treats a null overwrite as false rather than rejecting it', () => {
    const parsed = setBatchUserEnrolmentIdSchema.safeParse(
      validPayload({ overwrite: null }),
    )
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data.overwrite).toBe(false)
  })

  it('keeps an explicit overwrite: true', () => {
    const parsed = setBatchUserEnrolmentIdSchema.safeParse(
      validPayload({ overwrite: true }),
    )
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data.overwrite).toBe(true)
  })

  it('rejects a non-boolean overwrite', () => {
    expect(
      setBatchUserEnrolmentIdSchema.safeParse(
        validPayload({ overwrite: 'yes' }),
      ).success,
    ).toBe(false)
  })

  it('rejects a missing mandatory id', () => {
    const payload = validPayload()
    delete (payload as Record<string, unknown>).user_id
    expect(setBatchUserEnrolmentIdSchema.safeParse(payload).success).toBe(false)
  })
})
