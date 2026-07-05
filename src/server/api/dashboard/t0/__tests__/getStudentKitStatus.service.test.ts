import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getStudentKitStatus } from '../getStudentKitStatus.service'

const hoisted = vi.hoisted(() => ({ execute: vi.fn(), buildRedirect: vi.fn() }))

vi.mock('@/db', () => ({ db: { execute: hoisted.execute } }))
vi.mock('@/server/admissions/buildAdmissionsRedirectForUser', () => ({
  buildAdmissionsRedirectForUser: hoisted.buildRedirect,
}))

beforeEach(() => {
  vi.clearAllMocks()
  hoisted.buildRedirect.mockResolvedValue('https://sso/kit-form')
})

const row = (over: Record<string, unknown> = {}) => ({
  student_kit_exists: 1,
  student_kit_details_filled: 0,
  student_kit_tracking_url: null,
  payment_url: 'https://pay/x',
  ...over,
})

describe('getStudentKitStatus', () => {
  it('is not applicable when there is no kit', async () => {
    hoisted.execute.mockResolvedValue([row({ student_kit_exists: 0 })])
    const kit = await getStudentKitStatus(1, 5)
    expect(kit).toEqual({ applicable: false, detailsFilled: false, trackingUrl: null, trackingId: null, admissionsFormUrl: null })
    expect(hoisted.buildRedirect).not.toHaveBeenCalled()
  })

  it('offers an admissions SSO form link when details are not filled', async () => {
    hoisted.execute.mockResolvedValue([row()])
    const kit = await getStudentKitStatus(1, 5)
    expect(kit.applicable).toBe(true)
    expect(kit.detailsFilled).toBe(false)
    expect(kit.admissionsFormUrl).toBe('https://sso/kit-form')
    expect(hoisted.buildRedirect).toHaveBeenCalledWith(1, 'https://pay/x')
  })

  it('is pending tracking when filled but no tracking url', async () => {
    hoisted.execute.mockResolvedValue([row({ student_kit_details_filled: 1 })])
    const kit = await getStudentKitStatus(1, 5)
    expect(kit).toMatchObject({ applicable: true, detailsFilled: true, trackingUrl: null, admissionsFormUrl: null })
    expect(hoisted.buildRedirect).not.toHaveBeenCalled()
  })

  it('surfaces the tracking url when the kit has shipped', async () => {
    hoisted.execute.mockResolvedValue([row({ student_kit_details_filled: 1, student_kit_tracking_url: 'https://track/123' })])
    const kit = await getStudentKitStatus(1, 5)
    expect(kit).toMatchObject({ applicable: true, detailsFilled: true, trackingUrl: 'https://track/123' })
  })
})
