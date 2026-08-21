import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getT0AdmissionsStatus } from '../getT0AdmissionsStatus.service'

const hoisted = vi.hoisted(() => ({
  execute: vi.fn(),
  getStatus: vi.fn(),
  buildRedirect: vi.fn(),
}))

// `db.execute(...)` handles the payment_url SELECT and the meta dump UPDATE.
vi.mock('@/db', () => ({ db: { execute: hoisted.execute } }))
// The student code admissions keys off comes from batch_user, not users.username.
vi.mock('@/server/users/getStudentCode', () => ({
  resolveStudentCode: vi.fn(() => Promise.resolve('MSC2024001')),
}))
vi.mock('@/server/admissions/getAdmissionsStudentStatus', () => ({
  getAdmissionsStudentStatus: hoisted.getStatus,
}))
vi.mock('@/server/admissions/buildAdmissionsRedirectForUser', () => ({
  buildAdmissionsRedirectForUser: hoisted.buildRedirect,
}))

beforeEach(() => {
  vi.clearAllMocks()
  hoisted.buildRedirect.mockResolvedValue('https://sso/redirect')
  // First execute: the payment_url SELECT. Later ones default to a no-op.
  hoisted.execute.mockResolvedValue([{ payment_url: 'https://pay/x' }])
})

const dumpCalls = () =>
  hoisted.execute.mock.calls
    .map((c) => JSON.stringify(c[0]))
    .filter((s) => s.includes('admissionResponse'))

describe('getT0AdmissionsStatus', () => {
  it('projects the admissions response and dumps the raw payload into meta', async () => {
    const raw = {
      documents: {
        required: true,
        documentsUploaded: true,
        documentsVerified: false,
      },
      kit: {
        showKit: true,
        detailsFilled: true,
        tracking: { trackingUrl: 'https://track/1', trackingId: 'CK1' },
      },
      idCard: { url: 'https://cdn/id-card.png' },
    }
    hoisted.getStatus.mockResolvedValue(raw)

    const result = await getT0AdmissionsStatus(1, 5)

    expect(result).toMatchObject({
      documentsRequired: true,
      documentsUploaded: true,
      documentsVerified: false,
      kitApplicable: true,
      kitDetailsFilled: true,
      trackingUrl: 'https://track/1',
      trackingId: 'CK1',
      idCardUrl: 'https://cdn/id-card.png',
    })

    // The latest raw response is dumped into meta.admissionResponse.
    const dumps = dumpCalls()
    expect(dumps).toHaveLength(1)
    expect(dumps[0]).toContain('https://cdn/id-card.png')
  })

  it('returns the empty status without dumping when the API has no data', async () => {
    hoisted.getStatus.mockResolvedValue(null)

    const result = await getT0AdmissionsStatus(1, 5)

    expect(result.documentsRequired).toBe(false)
    expect(result.idCardUrl).toBeNull()
    expect(result.admissionsFormUrl).toBe('https://sso/redirect')
    expect(dumpCalls()).toHaveLength(0)
  })
})
