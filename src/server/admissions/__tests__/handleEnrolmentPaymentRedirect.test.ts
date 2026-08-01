import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { handleEnrolmentPaymentRedirect } from '@/server/admissions/handleEnrolmentPaymentRedirect'

const state = vi.hoisted(() => ({ rows: [] as unknown[] }))
const getCurrentUserId = vi.hoisted(() => vi.fn())
const bootstrapLoginWithToken = vi.hoisted(() => vi.fn())
const getAdmissionsSsoPayloadForUser = vi.hoisted(() => vi.fn())
const signAdmissionsSsoToken = vi.hoisted(() => vi.fn())

vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({ limit: () => Promise.resolve(state.rows) }),
      }),
    }),
  },
}))
vi.mock('@/server/auth/getCurrentSessionUserId', () => ({ getCurrentUserId }))
vi.mock('@/server/auth/bootstrapLogin', () => ({ bootstrapLoginWithToken }))
vi.mock('@/server/admissions/getAdmissionsSsoPayloadForUser', () => ({
  getAdmissionsSsoPayloadForUser,
}))
vi.mock('@/server/admissions/createAdmissionsSsoToken', () => ({
  signAdmissionsSsoToken,
}))
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const PAYLOAD = {
  userId: '7',
  name: 'Asha',
  email: 'a@b.com',
  mobile: '',
  platform: 'LMS',
  avatar: '',
}

function request(query = '?enrolmentId=2032'): Request {
  return new Request(
    `http://localhost/api/admissions/enrolment-payment-redirect${query}`,
  )
}

beforeEach(() => {
  state.rows = [{ id: 55 }] // eligible by default
  getCurrentUserId.mockReset().mockResolvedValue(7)
  bootstrapLoginWithToken.mockReset().mockResolvedValue({ id: 7, name: 'Asha' })
  getAdmissionsSsoPayloadForUser.mockReset().mockResolvedValue(PAYLOAD)
  signAdmissionsSsoToken.mockReset().mockReturnValue('fresh-jwt')
  process.env.ADMISSIONS_SSO_BASE_URL = 'https://admissions.example.com'
})

afterEach(() => {
  delete process.env.ADMISSIONS_SSO_BASE_URL
})

describe('handleEnrolmentPaymentRedirect', () => {
  it('302s to admissions /lms-login using the existing session (no token)', async () => {
    const res = await handleEnrolmentPaymentRedirect(request())
    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe(
      'https://admissions.example.com/lms-login?token=fresh-jwt&enrolment_id=2032',
    )
    expect(signAdmissionsSsoToken).toHaveBeenCalledWith(PAYLOAD, {
      enrolment_id: 2032,
    })
    // No token in the URL → the bootstrap path is never taken.
    expect(bootstrapLoginWithToken).not.toHaveBeenCalled()
  })

  it('bounces to / when there is no session and no bootstrap token', async () => {
    getCurrentUserId.mockResolvedValue(null)
    const res = await handleEnrolmentPaymentRedirect(request())
    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe('/')
    expect(bootstrapLoginWithToken).not.toHaveBeenCalled()
    expect(signAdmissionsSsoToken).not.toHaveBeenCalled()
  })

  it('prefers the bootstrap token over an existing session (token-first)', async () => {
    // A different user is logged in via cookie; the token must win.
    getCurrentUserId.mockResolvedValue(999)
    bootstrapLoginWithToken.mockResolvedValue({ id: 7, name: 'Asha' })
    const res = await handleEnrolmentPaymentRedirect(
      request('?enrolmentId=2032&token=bootstrap.jwt'),
    )
    expect(bootstrapLoginWithToken).toHaveBeenCalledWith({
      data: 'bootstrap.jwt',
    })
    // Cookie is not consulted when the token resolves a user.
    expect(getCurrentUserId).not.toHaveBeenCalled()
    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe(
      'https://admissions.example.com/lms-login?token=fresh-jwt&enrolment_id=2032',
    )
  })

  it('falls back to the session cookie when the bootstrap token is invalid', async () => {
    getCurrentUserId.mockResolvedValue(7)
    bootstrapLoginWithToken.mockResolvedValue(null)
    const res = await handleEnrolmentPaymentRedirect(
      request('?enrolmentId=2032&token=bad'),
    )
    expect(bootstrapLoginWithToken).toHaveBeenCalledWith({ data: 'bad' })
    expect(getCurrentUserId).toHaveBeenCalled()
    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe(
      'https://admissions.example.com/lms-login?token=fresh-jwt&enrolment_id=2032',
    )
  })

  it('bounces to / when the token is invalid and there is no session', async () => {
    getCurrentUserId.mockResolvedValue(null)
    bootstrapLoginWithToken.mockResolvedValue(null)
    const res = await handleEnrolmentPaymentRedirect(
      request('?enrolmentId=2032&token=bad'),
    )
    expect(res.headers.get('Location')).toBe('/')
    expect(signAdmissionsSsoToken).not.toHaveBeenCalled()
  })

  it('bounces to / for an invalid enrolmentId', async () => {
    const res = await handleEnrolmentPaymentRedirect(
      request('?enrolmentId=abc'),
    )
    expect(res.headers.get('Location')).toBe('/')
    expect(signAdmissionsSsoToken).not.toHaveBeenCalled()
  })

  it('bounces to / when the enrolment is not an eligible transfer for the user', async () => {
    state.rows = []
    const res = await handleEnrolmentPaymentRedirect(request())
    expect(res.headers.get('Location')).toBe('/')
    expect(signAdmissionsSsoToken).not.toHaveBeenCalled()
  })

  it('bounces to / when SSO is not configured', async () => {
    delete process.env.ADMISSIONS_SSO_BASE_URL
    const res = await handleEnrolmentPaymentRedirect(request())
    expect(res.headers.get('Location')).toBe('/')
    expect(signAdmissionsSsoToken).not.toHaveBeenCalled()
  })
})
