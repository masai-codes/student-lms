import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  acceptUndertakingRequest,
  fetchAchievements,
  fetchEmailPreferences,
  fetchProfileCertificates,
  fetchProfileInvoices,
  fetchProfileOverview,
  fetchProfileSessions,
  fetchStudentKit,
  fetchUndertakings,
  revokeOtherSessionsRequest,
  revokeSessionRequest,
  updateEmailPreferencesRequest,
  updatePasswordRequest,
  updateProfileRequest,
} from '@/lib/api/profile/profileApi'
import { PROFILE_API } from '@/lib/api/profile/profilePaths'

const hoisted = vi.hoisted(() => ({ fetchJson: vi.fn() }))
vi.mock('@/lib/api/fetchJson', () => ({ fetchJson: hoisted.fetchJson }))

/** The (path, options) pair the helper handed to `fetchJson`. */
const call = () => hoisted.fetchJson.mock.calls[0] as [string, RequestInit?]

beforeEach(() => vi.clearAllMocks())

describe('PROFILE_API paths', () => {
  it('encodes path parameters', () => {
    expect(PROFILE_API.session('sess/b?x')).toBe(
      '/api/profile/sessions/sess%2Fb%3Fx',
    )
    expect(PROFILE_API.acceptUndertaking(11)).toBe(
      '/api/profile/undertakings/11/accept',
    )
  })
})

describe('read helpers', () => {
  it('unwraps the profile overview', async () => {
    hoisted.fetchJson.mockResolvedValue({ profile: { name: 'Riya' } })
    await expect(fetchProfileOverview()).resolves.toEqual({ name: 'Riya' })
    expect(call()[0]).toBe(PROFILE_API.overview)
  })

  it('unwraps sessions', async () => {
    hoisted.fetchJson.mockResolvedValue({ sessions: [{ id: 'a' }] })
    await expect(fetchProfileSessions()).resolves.toEqual([{ id: 'a' }])
    expect(call()[0]).toBe(PROFILE_API.sessions)
  })

  it('unwraps email preferences', async () => {
    hoisted.fetchJson.mockResolvedValue({ preferences: { lectures: true } })
    await expect(fetchEmailPreferences()).resolves.toEqual({ lectures: true })
    expect(call()[0]).toBe(PROFILE_API.emailPreferences)
  })

  it('unwraps undertakings', async () => {
    hoisted.fetchJson.mockResolvedValue({ undertakings: [{ sectionId: 11 }] })
    await expect(fetchUndertakings()).resolves.toEqual([{ sectionId: 11 }])
    expect(call()[0]).toBe(PROFILE_API.undertakings)
  })

  it('returns the achievements envelope whole (it carries the share base URL)', async () => {
    const payload = { achievements: [], shareBaseUrl: 'https://api.example' }
    hoisted.fetchJson.mockResolvedValue(payload)
    await expect(fetchAchievements()).resolves.toEqual(payload)
    expect(call()[0]).toBe(PROFILE_API.achievements)
  })

  it('unwraps certificates, kit and invoices', async () => {
    hoisted.fetchJson.mockResolvedValue({ certificates: [{ code: 'c' }] })
    await expect(fetchProfileCertificates()).resolves.toEqual([{ code: 'c' }])
    expect(call()[0]).toBe(PROFILE_API.certificates)

    vi.clearAllMocks()
    hoisted.fetchJson.mockResolvedValue({ kit: { showKit: true } })
    await expect(fetchStudentKit()).resolves.toEqual({ showKit: true })
    expect(call()[0]).toBe(PROFILE_API.studentKit)

    vi.clearAllMocks()
    hoisted.fetchJson.mockResolvedValue({ invoices: [{ amount: 1 }] })
    await expect(fetchProfileInvoices()).resolves.toEqual([{ amount: 1 }])
    expect(call()[0]).toBe(PROFILE_API.invoices)
  })
})

describe('write helpers', () => {
  it('PATCHes the profile as JSON', async () => {
    hoisted.fetchJson.mockResolvedValue({ name: 'Riya', phone: null })
    await updateProfileRequest({ name: 'Riya' })

    const [path, options] = call()
    expect(path).toBe(PROFILE_API.overview)
    expect(options?.method).toBe('PATCH')
    expect(options?.body).toBe(JSON.stringify({ name: 'Riya' }))
    expect(options?.headers).toEqual({ 'Content-Type': 'application/json' })
  })

  it('PUTs the password change', async () => {
    hoisted.fetchJson.mockResolvedValue({ updated: true })
    await updatePasswordRequest({ currentPassword: 'a', newPassword: 'b' })

    const [path, options] = call()
    expect(path).toBe(PROFILE_API.password)
    expect(options?.method).toBe('PUT')
  })

  it('DELETEs one session and all others', async () => {
    hoisted.fetchJson.mockResolvedValue({ revoked: true })
    await revokeSessionRequest('sess-b')
    expect(call()).toEqual([
      '/api/profile/sessions/sess-b',
      { method: 'DELETE' },
    ])

    vi.clearAllMocks()
    hoisted.fetchJson.mockResolvedValue({ revokedCount: 2 })
    await revokeOtherSessionsRequest()
    expect(call()).toEqual([PROFILE_API.sessions, { method: 'DELETE' }])
  })

  it('PATCHes an email-preference patch and unwraps the result', async () => {
    hoisted.fetchJson.mockResolvedValue({ preferences: { lectures: false } })
    await expect(
      updateEmailPreferencesRequest({ lectures: false }),
    ).resolves.toEqual({ lectures: false })

    const [path, options] = call()
    expect(path).toBe(PROFILE_API.emailPreferences)
    expect(options?.method).toBe('PATCH')
    expect(options?.body).toBe(JSON.stringify({ lectures: false }))
  })

  it('POSTs an acceptance with the section id in the path, not the body', async () => {
    hoisted.fetchJson.mockResolvedValue({ accepted: true })
    await acceptUndertakingRequest({
      sectionId: 11,
      location: 'Bengaluru',
      ipAddress: '1.2.3.4',
    })

    const [path, options] = call()
    expect(path).toBe('/api/profile/undertakings/11/accept')
    expect(options?.method).toBe('POST')
    expect(JSON.parse(String(options?.body))).toEqual({
      location: 'Bengaluru',
      ipAddress: '1.2.3.4',
    })
  })
})
