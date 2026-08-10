import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  handleGetMasaiLiveLogin,
  handlePostMasaiLiveLogin,
} from '@/server/api/user-auth/handlers/masaiLiveLogin.handler'

const requireSessionUserId = vi.hoisted(() => vi.fn())
const loadMasaiLiveUser = vi.hoisted(() => vi.fn())
const resolveMasaiLiveConnectSid = vi.hoisted(() => vi.fn())

vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId,
}))
vi.mock(
  '@/server/api/user-auth/services/resolveMasaiLiveConnectSid.service',
  () => ({
    loadMasaiLiveUser,
    resolveMasaiLiveConnectSid,
  }),
)
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const USER = {
  id: 7,
  username: 'stu001',
  email: 'stu@example.com',
  meta: {},
}

beforeEach(() => {
  requireSessionUserId.mockReset().mockResolvedValue(7)
  loadMasaiLiveUser.mockReset().mockResolvedValue(USER)
  resolveMasaiLiveConnectSid.mockReset()
  delete process.env.FRONTEND_URL
})

afterEach(() => {
  delete process.env.FRONTEND_URL
})

describe('handlePostMasaiLiveLogin', () => {
  it('returns connectSid JSON on success', async () => {
    resolveMasaiLiveConnectSid.mockResolvedValue({
      ok: true,
      connectSid: 's%3Ax',
    })
    const res = await handlePostMasaiLiveLogin(
      new Request('http://localhost/api/user-auth/masai-live-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirect: 'https://live.test' }),
      }),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      success: true,
      data: { connectSid: 's%3Ax' },
    })
    expect(resolveMasaiLiveConnectSid).toHaveBeenCalledWith(
      USER,
      'https://live.test',
    )
  })

  it('defaults redirect when the body is empty or invalid JSON', async () => {
    resolveMasaiLiveConnectSid.mockResolvedValue({
      ok: true,
      connectSid: 's%3Ax',
    })
    const res = await handlePostMasaiLiveLogin(
      new Request('http://localhost/api/user-auth/masai-live-login', {
        method: 'POST',
        body: 'not-json',
      }),
    )
    expect(res.status).toBe(200)
    expect(resolveMasaiLiveConnectSid).toHaveBeenCalledWith(
      USER,
      'https://masai-live.masaischool.com',
    )
  })

  it('returns 401 when the session user row is missing', async () => {
    loadMasaiLiveUser.mockResolvedValue(null)
    const res = await handlePostMasaiLiveLogin(
      new Request('http://localhost/api/user-auth/masai-live-login', {
        method: 'POST',
        body: '{}',
      }),
    )
    expect(res.status).toBe(401)
  })

  it('returns the service status/message on failure', async () => {
    resolveMasaiLiveConnectSid.mockResolvedValue({
      ok: false,
      kind: 'not_found',
      status: 404,
      message: 'User enrolment not found',
    })
    const res = await handlePostMasaiLiveLogin(
      new Request('http://localhost/api/user-auth/masai-live-login', {
        method: 'POST',
        body: '{}',
      }),
    )
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({
      success: false,
      message: 'User enrolment not found',
    })
  })
})

describe('handleGetMasaiLiveLogin', () => {
  it('sets connect.sid and redirects to the destination on success', async () => {
    resolveMasaiLiveConnectSid.mockResolvedValue({
      ok: true,
      connectSid: 's%3Asession',
    })
    const res = await handleGetMasaiLiveLogin(
      new Request(
        'http://localhost/api/user-auth/masai-live-login?redirect=https%3A%2F%2Flive.test%2Fjoin',
      ),
    )
    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe('https://live.test/join')
    expect(res.headers.get('Set-Cookie')).toContain('connect.sid=')
    expect(res.headers.get('Set-Cookie')).toContain('Domain=.masaischool.com')
  })

  it('still redirects to Masai Live when enrolment is missing', async () => {
    resolveMasaiLiveConnectSid.mockResolvedValue({
      ok: false,
      kind: 'not_found',
      status: 404,
      message: 'User enrolment not found',
    })
    const res = await handleGetMasaiLiveLogin(
      new Request(
        'http://localhost/api/user-auth/masai-live-login?redirect=https%3A%2F%2Flive.test',
      ),
    )
    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe('https://live.test')
    expect(res.headers.get('Set-Cookie')).toBeNull()
  })

  it('bounces home on other failures', async () => {
    process.env.FRONTEND_URL = 'https://students.example.com'
    resolveMasaiLiveConnectSid.mockResolvedValue({
      ok: false,
      kind: 'config',
      status: 503,
      message: 'Admissions login is not available right now',
    })
    const res = await handleGetMasaiLiveLogin(
      new Request('http://localhost/api/user-auth/masai-live-login'),
    )
    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe('https://students.example.com')
  })

  it('bounces home when the session user row is missing', async () => {
    loadMasaiLiveUser.mockResolvedValue(null)
    const res = await handleGetMasaiLiveLogin(
      new Request('http://localhost/api/user-auth/masai-live-login'),
    )
    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe('/')
    expect(resolveMasaiLiveConnectSid).not.toHaveBeenCalled()
  })

  it('bounces home when the session is missing', async () => {
    const { ApiError } = await import('@/server/api/http/apiError')
    requireSessionUserId.mockRejectedValue(new ApiError(401, 'UNAUTHORIZED'))
    const res = await handleGetMasaiLiveLogin(
      new Request('http://localhost/api/user-auth/masai-live-login'),
    )
    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe('/')
  })
})
