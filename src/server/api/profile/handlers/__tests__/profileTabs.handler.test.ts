import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  getUserId: vi.fn(),
  getAchievements: vi.fn(),
  getProfileCertificates: vi.fn(),
  getStudentKit: vi.fn(),
  getInvoices: vi.fn(),
  resolveBadgeLandingBaseUrl: vi.fn(),
}))

vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getCurrentUserId: hoisted.getUserId,
  getCurrentUserSessionId: vi.fn(),
}))
vi.mock('@/server/api/profile/getAchievements.service', () => ({
  getAchievements: hoisted.getAchievements,
}))
vi.mock('@/server/api/profile/getProfileCertificates.service', () => ({
  getProfileCertificates: hoisted.getProfileCertificates,
}))
vi.mock('@/server/api/profile/studentStatus.service', () => ({
  getStudentKit: hoisted.getStudentKit,
  getInvoices: hoisted.getInvoices,
}))
vi.mock('@/server/api/profile/badgeLandingUrl', () => ({
  resolveBadgeLandingBaseUrl: hoisted.resolveBadgeLandingBaseUrl,
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  hoisted.getUserId.mockResolvedValue(101)
})

describe('handleGetAchievements', () => {
  it('returns achievements alongside the share base URL', async () => {
    hoisted.getAchievements.mockResolvedValue([{ badgeConfigId: 1 }])
    hoisted.resolveBadgeLandingBaseUrl.mockReturnValue('https://api.example')
    const { handleGetAchievements } = await import('../profileTabs.handler')

    const response = await handleGetAchievements()
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      achievements: [{ badgeConfigId: 1 }],
      shareBaseUrl: 'https://api.example',
    })
  })

  it('sends a null share base URL when sharing is unconfigured', async () => {
    hoisted.getAchievements.mockResolvedValue([])
    hoisted.resolveBadgeLandingBaseUrl.mockReturnValue(null)
    const { handleGetAchievements } = await import('../profileTabs.handler')

    await expect((await handleGetAchievements()).json()).resolves.toEqual({
      achievements: [],
      shareBaseUrl: null,
    })
  })

  it('401s when unauthenticated', async () => {
    hoisted.getUserId.mockResolvedValue(null)
    const { handleGetAchievements } = await import('../profileTabs.handler')
    expect((await handleGetAchievements()).status).toBe(401)
  })
})

describe('the remaining tab handlers', () => {
  it('each returns its own payload key', async () => {
    hoisted.getProfileCertificates.mockResolvedValue([{ code: 'c' }])
    hoisted.getStudentKit.mockResolvedValue({ showKit: true })
    hoisted.getInvoices.mockResolvedValue([{ paymentType: 'Full fees' }])
    const handlers = await import('../profileTabs.handler')

    await expect(
      (await handlers.handleGetProfileCertificates()).json(),
    ).resolves.toEqual({ certificates: [{ code: 'c' }] })
    await expect(
      (await handlers.handleGetStudentKit()).json(),
    ).resolves.toEqual({ kit: { showKit: true } })
    await expect((await handlers.handleGetInvoices()).json()).resolves.toEqual({
      invoices: [{ paymentType: 'Full fees' }],
    })
  })

  it('each maps an unexpected failure to a server error', async () => {
    hoisted.getAchievements.mockRejectedValue(new Error('boom'))
    hoisted.getProfileCertificates.mockRejectedValue(new Error('boom'))
    hoisted.getStudentKit.mockRejectedValue(new Error('boom'))
    hoisted.getInvoices.mockRejectedValue(new Error('boom'))
    const handlers = await import('../profileTabs.handler')

    for (const response of [
      await handlers.handleGetAchievements(),
      await handlers.handleGetProfileCertificates(),
      await handlers.handleGetStudentKit(),
      await handlers.handleGetInvoices(),
    ]) {
      await expect(response.json()).resolves.toEqual(
        expect.objectContaining({ code: 'INTERNAL_SERVER_ERROR' }),
      )
    }
  })

  it('each 401s when unauthenticated', async () => {
    hoisted.getUserId.mockResolvedValue(null)
    const handlers = await import('../profileTabs.handler')

    expect((await handlers.handleGetProfileCertificates()).status).toBe(401)
    expect((await handlers.handleGetStudentKit()).status).toBe(401)
    expect((await handlers.handleGetInvoices()).status).toBe(401)
  })
})
