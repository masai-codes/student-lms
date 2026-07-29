import { describe, expect, it } from 'vitest'

import type { CreateEnrolmentInput } from '@/server/api/webhooks/admissions/types'
import { redactEnrolmentPayload } from '@/server/api/webhooks/admissions/utils/redactPayload'

const INPUT = {
  name: 'Asha Rao',
  email: 'asha@example.com',
  password: 'super-secret',
  mobile: '9998887776',
  username: 'asha',
  section_ids: [1, 2],
  batch_id: 10,
  enrolment_id: 999,
} as unknown as CreateEnrolmentInput

describe('redactEnrolmentPayload', () => {
  it('removes the password', () => {
    const result = redactEnrolmentPayload(INPUT)
    expect(result.password).toBeUndefined()
    expect('password' in result).toBe(false)
  })

  it('keeps every other field verbatim', () => {
    const result = redactEnrolmentPayload(INPUT)
    expect(result).toEqual({
      name: 'Asha Rao',
      email: 'asha@example.com',
      mobile: '9998887776',
      username: 'asha',
      section_ids: [1, 2],
      batch_id: 10,
      enrolment_id: 999,
    })
  })

  it('does not mutate the input', () => {
    redactEnrolmentPayload(INPUT)
    expect(INPUT.password).toBe('super-secret')
  })
})
