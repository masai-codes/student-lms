import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/server/api/http/apiError'

const hoisted = vi.hoisted(() => ({
  getUserId: vi.fn(),
  getSessionId: vi.fn(),
  getProfileOverview: vi.fn(),
  updateProfile: vi.fn(),
  updatePassword: vi.fn(),
  getSessions: vi.fn(),
  removeSession: vi.fn(),
  removeOtherSessions: vi.fn(),
  getEmailPreferences: vi.fn(),
  updateEmailPreferences: vi.fn(),
  parsePreferencePatch: vi.fn(),
  getPendingUndertakings: vi.fn(),
  acceptUndertaking: vi.fn(),
}))

vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getCurrentUserId: hoisted.getUserId,
  getCurrentUserSessionId: hoisted.getSessionId,
}))
vi.mock('@/server/api/profile/getProfileOverview.service', () => ({
  getProfileOverview: hoisted.getProfileOverview,
}))
vi.mock('@/server/api/profile/updateProfile.service', () => ({
  updateProfile: hoisted.updateProfile,
}))
vi.mock('@/server/api/profile/updatePassword.service', () => ({
  updatePassword: hoisted.updatePassword,
}))
vi.mock('@/server/api/profile/sessions.service', () => ({
  getSessions: hoisted.getSessions,
  removeSession: hoisted.removeSession,
  removeOtherSessions: hoisted.removeOtherSessions,
}))
vi.mock('@/server/api/profile/emailPreferences.service', () => ({
  getEmailPreferences: hoisted.getEmailPreferences,
  updateEmailPreferences: hoisted.updateEmailPreferences,
  parsePreferencePatch: hoisted.parsePreferencePatch,
}))
vi.mock('@/server/api/profile/undertakings.service', () => ({
  getPendingUndertakings: hoisted.getPendingUndertakings,
  acceptUndertaking: hoisted.acceptUndertaking,
}))

const jsonRequest = (body: unknown) =>
  new Request('http://localhost/api/profile', {
    method: 'POST',
    body: JSON.stringify(body),
  })

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  hoisted.getUserId.mockResolvedValue(101)
  hoisted.getSessionId.mockReturnValue('sess-a')
})

describe('profile overview handlers', () => {
  it('returns the profile for an authenticated request', async () => {
    hoisted.getProfileOverview.mockResolvedValue({ name: 'Riya' })
    const { handleGetProfileOverview } =
      await import('../profileOverview.handler')

    const response = await handleGetProfileOverview()
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      profile: { name: 'Riya' },
    })
  })

  it('401s when unauthenticated', async () => {
    hoisted.getUserId.mockResolvedValue(null)
    const { handleGetProfileOverview } =
      await import('../profileOverview.handler')
    expect((await handleGetProfileOverview()).status).toBe(401)
  })

  it('maps an unexpected failure to a generic server error', async () => {
    hoisted.getProfileOverview.mockRejectedValue(new Error('boom'))
    const { handleGetProfileOverview } =
      await import('../profileOverview.handler')
    await expect((await handleGetProfileOverview()).json()).resolves.toEqual(
      expect.objectContaining({ code: 'INTERNAL_SERVER_ERROR' }),
    )
  })

  it('passes only string fields through to the update service', async () => {
    hoisted.updateProfile.mockResolvedValue({ name: 'Riya', phone: null })
    const { handleUpdateProfile } = await import('../profileOverview.handler')

    const response = await handleUpdateProfile(
      jsonRequest({ name: 'Riya', secondaryMobile: 12345, extra: 'ignored' }),
    )

    expect(response.status).toBe(200)
    expect(hoisted.updateProfile).toHaveBeenCalledWith(101, {
      name: 'Riya',
      secondaryMobile: undefined,
    })
  })

  it('surfaces a validation ApiError from the update service', async () => {
    hoisted.updateProfile.mockRejectedValue(
      new ApiError(400, 'INVALID_MOBILE', 'nope'),
    )
    const { handleUpdateProfile } = await import('../profileOverview.handler')

    const response = await handleUpdateProfile(jsonRequest({ name: 'Riya' }))
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ code: 'INVALID_MOBILE' }),
    )
  })

  it('maps an unexpected update failure to a server error', async () => {
    hoisted.updateProfile.mockRejectedValue(new Error('boom'))
    const { handleUpdateProfile } = await import('../profileOverview.handler')
    await expect(
      (await handleUpdateProfile(jsonRequest({ name: 'Riya' }))).json(),
    ).resolves.toEqual(
      expect.objectContaining({ code: 'INTERNAL_SERVER_ERROR' }),
    )
  })
})

describe('handleUpdatePassword', () => {
  it('updates the password for a well-formed payload', async () => {
    hoisted.updatePassword.mockResolvedValue(undefined)
    const { handleUpdatePassword } = await import('../updatePassword.handler')

    const response = await handleUpdatePassword(
      jsonRequest({ currentPassword: 'old', newPassword: 'brandnewpass' }),
    )

    expect(response.status).toBe(200)
    expect(hoisted.updatePassword).toHaveBeenCalledWith(101, {
      currentPassword: 'old',
      newPassword: 'brandnewpass',
    })
  })

  it('400s on a malformed payload without calling the service', async () => {
    const { handleUpdatePassword } = await import('../updatePassword.handler')

    const response = await handleUpdatePassword(jsonRequest({ newPassword: 1 }))
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ code: 'INVALID_PASSWORD_PAYLOAD' }),
    )
    expect(hoisted.updatePassword).not.toHaveBeenCalled()
  })

  it('maps an unexpected failure to a server error', async () => {
    hoisted.updatePassword.mockRejectedValue(new Error('boom'))
    const { handleUpdatePassword } = await import('../updatePassword.handler')
    await expect(
      (
        await handleUpdatePassword(
          jsonRequest({ currentPassword: 'a', newPassword: 'b' }),
        )
      ).json(),
    ).resolves.toEqual(
      expect.objectContaining({ code: 'INTERNAL_SERVER_ERROR' }),
    )
  })
})

describe('session handlers', () => {
  it('lists sessions, passing the caller’s own session id through', async () => {
    hoisted.getSessions.mockResolvedValue([{ id: 'sess-a' }])
    const { handleGetSessions } = await import('../sessions.handler')

    const response = await handleGetSessions()
    expect(response.status).toBe(200)
    expect(hoisted.getSessions).toHaveBeenCalledWith(101, 'sess-a')
  })

  it('revokes one session', async () => {
    hoisted.removeSession.mockResolvedValue(undefined)
    const { handleRemoveSession } = await import('../sessions.handler')

    const response = await handleRemoveSession('sess-b')
    expect(response.status).toBe(200)
    expect(hoisted.removeSession).toHaveBeenCalledWith(101, 'sess-b', 'sess-a')
  })

  it('surfaces a refusal to revoke the current session', async () => {
    hoisted.removeSession.mockRejectedValue(
      new ApiError(409, 'CANNOT_REVOKE_CURRENT_SESSION'),
    )
    const { handleRemoveSession } = await import('../sessions.handler')
    expect((await handleRemoveSession('sess-a')).status).toBe(409)
  })

  it('reports how many other sessions were revoked', async () => {
    hoisted.removeOtherSessions.mockResolvedValue(3)
    const { handleRemoveOtherSessions } = await import('../sessions.handler')

    await expect((await handleRemoveOtherSessions()).json()).resolves.toEqual({
      revokedCount: 3,
    })
  })

  it('maps unexpected session failures to server errors', async () => {
    hoisted.getSessions.mockRejectedValue(new Error('boom'))
    hoisted.removeSession.mockRejectedValue(new Error('boom'))
    hoisted.removeOtherSessions.mockRejectedValue(new Error('boom'))
    const handlers = await import('../sessions.handler')

    for (const response of [
      await handlers.handleGetSessions(),
      await handlers.handleRemoveSession('sess-b'),
      await handlers.handleRemoveOtherSessions(),
    ]) {
      await expect(response.json()).resolves.toEqual(
        expect.objectContaining({ code: 'INTERNAL_SERVER_ERROR' }),
      )
    }
  })
})

describe('email preference handlers', () => {
  it('returns the current preferences', async () => {
    hoisted.getEmailPreferences.mockResolvedValue({ lectures: true })
    const { handleGetEmailPreferences } =
      await import('../emailPreferences.handler')

    await expect((await handleGetEmailPreferences()).json()).resolves.toEqual({
      preferences: { lectures: true },
    })
  })

  it('narrows the patch before writing', async () => {
    hoisted.parsePreferencePatch.mockReturnValue({ lectures: false })
    hoisted.updateEmailPreferences.mockResolvedValue({ lectures: false })
    const { handleUpdateEmailPreferences } =
      await import('../emailPreferences.handler')

    const response = await handleUpdateEmailPreferences(
      jsonRequest({ lectures: false, nonsense: true }),
    )

    expect(response.status).toBe(200)
    expect(hoisted.updateEmailPreferences).toHaveBeenCalledWith(101, {
      lectures: false,
    })
  })

  it('maps unexpected preference failures to server errors', async () => {
    hoisted.getEmailPreferences.mockRejectedValue(new Error('boom'))
    hoisted.parsePreferencePatch.mockReturnValue({})
    hoisted.updateEmailPreferences.mockRejectedValue(new Error('boom'))
    const handlers = await import('../emailPreferences.handler')

    for (const response of [
      await handlers.handleGetEmailPreferences(),
      await handlers.handleUpdateEmailPreferences(jsonRequest({})),
    ]) {
      await expect(response.json()).resolves.toEqual(
        expect.objectContaining({ code: 'INTERNAL_SERVER_ERROR' }),
      )
    }
  })
})

describe('undertaking handlers', () => {
  it('lists pending undertakings', async () => {
    hoisted.getPendingUndertakings.mockResolvedValue([{ sectionId: 11 }])
    const { handleGetUndertakings } = await import('../undertakings.handler')

    await expect((await handleGetUndertakings()).json()).resolves.toEqual({
      undertakings: [{ sectionId: 11 }],
    })
  })

  it('accepts an undertaking with its provenance', async () => {
    hoisted.acceptUndertaking.mockResolvedValue(undefined)
    const { handleAcceptUndertaking } = await import('../undertakings.handler')

    const response = await handleAcceptUndertaking(
      11,
      jsonRequest({ location: 'Bengaluru', ipAddress: '1.2.3.4' }),
    )

    expect(response.status).toBe(200)
    expect(hoisted.acceptUndertaking).toHaveBeenCalledWith(101, {
      sectionId: 11,
      location: 'Bengaluru',
      ipAddress: '1.2.3.4',
    })
  })

  it('defaults a missing IP to an empty string', async () => {
    hoisted.acceptUndertaking.mockResolvedValue(undefined)
    const { handleAcceptUndertaking } = await import('../undertakings.handler')

    await handleAcceptUndertaking(11, jsonRequest({ location: 'Bengaluru' }))
    expect(hoisted.acceptUndertaking).toHaveBeenCalledWith(
      101,
      expect.objectContaining({ ipAddress: '' }),
    )
  })

  it('400s when the location is missing', async () => {
    const { handleAcceptUndertaking } = await import('../undertakings.handler')

    const response = await handleAcceptUndertaking(11, jsonRequest({}))
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ code: 'LOCATION_REQUIRED' }),
    )
    expect(hoisted.acceptUndertaking).not.toHaveBeenCalled()
  })

  it('maps unexpected undertaking failures to server errors', async () => {
    hoisted.getPendingUndertakings.mockRejectedValue(new Error('boom'))
    hoisted.acceptUndertaking.mockRejectedValue(new Error('boom'))
    const handlers = await import('../undertakings.handler')

    for (const response of [
      await handlers.handleGetUndertakings(),
      await handlers.handleAcceptUndertaking(
        11,
        jsonRequest({ location: 'Bengaluru' }),
      ),
    ]) {
      await expect(response.json()).resolves.toEqual(
        expect.objectContaining({ code: 'INTERNAL_SERVER_ERROR' }),
      )
    }
  })
})
