// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  fetchInterviewSttToken: vi.fn(),
}))

vi.mock('@/lib/api/interviews/interviewsApi', () => ({
  fetchInterviewSttToken: hoisted.fetchInterviewSttToken,
}))

function clearAllCookies() {
  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0]?.trim()
    if (name) document.cookie = `${name}=; path=/; max-age=0`
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  clearAllCookies()
})

describe('getOrCreateInterviewSttToken', () => {
  it('mints and caches a token on first use', async () => {
    hoisted.fetchInterviewSttToken.mockResolvedValueOnce({
      clientSecret: 'ek_first',
      expiresIn: 300,
    })
    const { getOrCreateInterviewSttToken } = await import('../sttTokenCache')

    const result = await getOrCreateInterviewSttToken(7)

    expect(result).toEqual({ clientSecret: 'ek_first' })
    expect(hoisted.fetchInterviewSttToken).toHaveBeenCalledTimes(1)
  })

  it('reuses the cached token on a later call instead of minting a new one', async () => {
    hoisted.fetchInterviewSttToken.mockResolvedValueOnce({
      clientSecret: 'ek_first',
      expiresIn: 300,
    })
    const { getOrCreateInterviewSttToken } = await import('../sttTokenCache')

    await getOrCreateInterviewSttToken(7)
    const second = await getOrCreateInterviewSttToken(7)

    expect(second).toEqual({ clientSecret: 'ek_first' })
    expect(hoisted.fetchInterviewSttToken).toHaveBeenCalledTimes(1)
  })

  it('mints a fresh token once the cached one is at/past its expiry margin', async () => {
    hoisted.fetchInterviewSttToken.mockResolvedValueOnce({
      clientSecret: 'ek_expiring',
      expiresIn: 10, // within the 20s safety margin — treated as already stale
    })
    const { getOrCreateInterviewSttToken } = await import('../sttTokenCache')

    await getOrCreateInterviewSttToken(7)
    hoisted.fetchInterviewSttToken.mockResolvedValueOnce({
      clientSecret: 'ek_fresh',
      expiresIn: 300,
    })
    const second = await getOrCreateInterviewSttToken(7)

    expect(second).toEqual({ clientSecret: 'ek_fresh' })
    expect(hoisted.fetchInterviewSttToken).toHaveBeenCalledTimes(2)
  })

  it('caches tokens per session id independently', async () => {
    hoisted.fetchInterviewSttToken.mockResolvedValueOnce({
      clientSecret: 'ek_session_a',
      expiresIn: 300,
    })
    hoisted.fetchInterviewSttToken.mockResolvedValueOnce({
      clientSecret: 'ek_session_b',
      expiresIn: 300,
    })
    const { getOrCreateInterviewSttToken } = await import('../sttTokenCache')

    const a = await getOrCreateInterviewSttToken(1)
    const b = await getOrCreateInterviewSttToken(2)

    expect(a).toEqual({ clientSecret: 'ek_session_a' })
    expect(b).toEqual({ clientSecret: 'ek_session_b' })
    expect(hoisted.fetchInterviewSttToken).toHaveBeenCalledTimes(2)
  })
})
