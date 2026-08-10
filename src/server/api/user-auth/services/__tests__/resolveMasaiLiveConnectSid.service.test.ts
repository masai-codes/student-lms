import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  loadMasaiLiveUser,
  resolveMasaiLiveConnectSid,
} from '@/server/api/user-auth/services/resolveMasaiLiveConnectSid.service'

const selectLimit = vi.hoisted(() => vi.fn())
const updateWhere = vi.hoisted(() => vi.fn())
const fetchMock = vi.hoisted(() => vi.fn())

vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => {
          const limit = (...args: unknown[]) => selectLimit(...args)
          return {
            limit,
            orderBy: () => ({ limit }),
          }
        },
      }),
    }),
    update: () => ({
      set: () => ({
        where: (...args: unknown[]) => updateWhere(...args),
      }),
    }),
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

vi.mock('jsonwebtoken', () => ({
  default: { sign: () => 'signed-jwt' },
}))

const USER = {
  id: 7,
  username: 'stu001',
  email: 'stu@example.com',
  meta: { existing: true },
}

beforeEach(() => {
  selectLimit.mockReset()
  updateWhere.mockReset().mockResolvedValue(undefined)
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  process.env.ADMISSIONS_SSO_SECRET = 'secret'
  process.env.ADMISSIONS_API_BASE_URL = 'https://admissions.example.com/'
})

afterEach(() => {
  delete process.env.ADMISSIONS_SSO_SECRET
  delete process.env.ADMISSIONS_API_BASE_URL
  vi.unstubAllGlobals()
})

describe('loadMasaiLiveUser', () => {
  it('returns the user row when present', async () => {
    selectLimit.mockResolvedValue([USER])
    await expect(loadMasaiLiveUser(7)).resolves.toEqual(USER)
  })

  it('returns null when the user is missing', async () => {
    selectLimit.mockResolvedValue([])
    await expect(loadMasaiLiveUser(7)).resolves.toBeNull()
  })
})

describe('resolveMasaiLiveConnectSid', () => {
  it('returns connectSid when admissions sets the cookie', async () => {
    selectLimit.mockResolvedValue([{ enrolmentId: 99 }])
    fetchMock.mockResolvedValue({
      status: 200,
      headers: {
        getSetCookie: () => ['connect.sid=s%3Asession; Path=/'],
        get: () => null,
      },
      json: async () => ({}),
    })

    const result = await resolveMasaiLiveConnectSid(USER, 'https://live.test')
    expect(result).toEqual({ ok: true, connectSid: 's%3Asession' })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://admissions.example.com/auth/lms-auto-login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          token: 'signed-jwt',
          redirect: 'https://live.test',
        }),
      }),
    )
  })

  it('flags the user and returns not_found when no enrolment exists', async () => {
    selectLimit.mockResolvedValue([])
    const result = await resolveMasaiLiveConnectSid(USER)
    expect(result).toEqual({
      ok: false,
      kind: 'not_found',
      status: 404,
      message: 'User enrolment not found',
    })
    expect(updateWhere).toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns config error when admissions env is missing', async () => {
    selectLimit.mockResolvedValue([{ enrolmentId: 1 }])
    delete process.env.ADMISSIONS_SSO_SECRET
    const result = await resolveMasaiLiveConnectSid(USER)
    expect(result).toMatchObject({ ok: false, kind: 'config', status: 503 })
  })

  it('maps admissions "not found" responses to not_found and flags the user', async () => {
    selectLimit.mockResolvedValue([{ enrolmentId: 1 }])
    fetchMock.mockResolvedValue({
      status: 404,
      headers: { getSetCookie: () => [], get: () => null },
      json: async () => ({ error: 'User not found' }),
    })
    const result = await resolveMasaiLiveConnectSid(USER)
    expect(result).toMatchObject({ ok: false, kind: 'not_found', status: 404 })
    expect(updateWhere).toHaveBeenCalled()
  })

  it('returns admissions errors for other 4xx responses', async () => {
    selectLimit.mockResolvedValue([{ enrolmentId: 1 }])
    fetchMock.mockResolvedValue({
      status: 401,
      headers: { getSetCookie: () => [], get: () => null },
      json: async () => ({ error: 'bad token' }),
    })
    const result = await resolveMasaiLiveConnectSid(USER)
    expect(result).toEqual({
      ok: false,
      kind: 'admissions',
      status: 401,
      message: 'bad token',
    })
  })

  it('returns no_cookie when admissions omits connect.sid', async () => {
    selectLimit.mockResolvedValue([{ enrolmentId: 1 }])
    fetchMock.mockResolvedValue({
      status: 200,
      headers: {
        getSetCookie: () => ['other=1'],
        get: () => null,
      },
      json: async () => ({}),
    })
    const result = await resolveMasaiLiveConnectSid(USER)
    expect(result).toMatchObject({ ok: false, kind: 'no_cookie', status: 502 })
  })

  it('falls back to the single set-cookie header when getSetCookie is absent', async () => {
    selectLimit.mockResolvedValue([{ enrolmentId: 1 }])
    fetchMock.mockResolvedValue({
      status: 200,
      headers: {
        get: (name: string) =>
          name === 'set-cookie' ? 'connect.sid=plain; Path=/' : null,
      },
      json: async () => ({}),
    })
    const result = await resolveMasaiLiveConnectSid(USER)
    expect(result).toEqual({ ok: true, connectSid: 'plain' })
  })

  it('maps string "not found" admissions errors without a 404 status', async () => {
    selectLimit.mockResolvedValue([{ enrolmentId: 1 }])
    fetchMock.mockResolvedValue({
      status: 400,
      headers: { getSetCookie: () => [], get: () => null },
      json: async () => ({ error: 'Student not found in system' }),
    })
    const result = await resolveMasaiLiveConnectSid(USER)
    expect(result).toMatchObject({ ok: false, kind: 'not_found', status: 404 })
  })

  it('uses a generic admissions message when the error body is empty', async () => {
    selectLimit.mockResolvedValue([{ enrolmentId: 1 }])
    fetchMock.mockResolvedValue({
      status: 400,
      headers: { getSetCookie: () => [], get: () => null },
      json: async () => ({}),
    })
    const result = await resolveMasaiLiveConnectSid(USER)
    expect(result).toEqual({
      ok: false,
      kind: 'admissions',
      status: 400,
      message: 'Admissions authentication failed',
    })
  })
})
