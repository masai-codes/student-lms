import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { syncLmsPremiumForMasaiLiveLogin } from '@/server/api/user-auth/services/syncLmsPremium.service'

const findCurrentLmsBatch = vi.hoisted(() => vi.fn())
const fetchMock = vi.hoisted(() => vi.fn())

vi.mock(
  '@/server/api/user-auth/services/findCurrentLmsBatch.service',
  () => ({
    findCurrentLmsBatch,
  }),
)
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const USER = {
  id: 7,
  username: 'stu001',
  email: 'Stu@Example.com',
  meta: {},
}

const BATCH = {
  id: 12,
  name: 'FT-WEB-27',
  starting: '2026-01-15',
  duration: '30 weeks',
  program: 'full_stack',
}

beforeEach(() => {
  findCurrentLmsBatch.mockReset()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  process.env.MASAI_LIVE_API_BASE = 'https://live.example.com/'
  process.env.LMS_MASAI_LIVE_INTERNAL_KEY = 'internal-key'
})

afterEach(() => {
  delete process.env.MASAI_LIVE_API_BASE
  delete process.env.LMS_MASAI_LIVE_INTERNAL_KEY
  vi.unstubAllGlobals()
})

describe('syncLmsPremiumForMasaiLiveLogin', () => {
  it('does nothing when env is not configured', async () => {
    delete process.env.MASAI_LIVE_API_BASE
    await syncLmsPremiumForMasaiLiveLogin({
      user: USER,
      connectSid: 'sid',
    })
    expect(findCurrentLmsBatch).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('grants when the user has a current batch', async () => {
    findCurrentLmsBatch.mockResolvedValue(BATCH)
    fetchMock.mockResolvedValue({ ok: true, status: 200 })

    await syncLmsPremiumForMasaiLiveLogin({
      user: USER,
      connectSid: 's%3Ax',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://live.example.com/internal/lms-premium/sync',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'internal-key',
        },
      }),
    )
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      action: 'grant',
      email: 'stu@example.com',
      lms_user_id: '7',
      batch_id: 12,
      batch_name: 'FT-WEB-27',
      connect_sid: 's%3Ax',
    })
  })

  it('revokes when the user has no current batch', async () => {
    findCurrentLmsBatch.mockResolvedValue(null)
    fetchMock.mockResolvedValue({ ok: true, status: 200 })

    await syncLmsPremiumForMasaiLiveLogin({
      user: USER,
      connectSid: 's%3Ax',
    })

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      action: 'revoke',
      email: 'stu@example.com',
      lms_user_id: '7',
      connect_sid: 's%3Ax',
    })
  })

  it('skips grant when connectSid is missing', async () => {
    findCurrentLmsBatch.mockResolvedValue(BATCH)
    await syncLmsPremiumForMasaiLiveLogin({ user: USER })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not throw when the Masai Live call fails', async () => {
    findCurrentLmsBatch.mockResolvedValue(BATCH)
    fetchMock.mockRejectedValue(new Error('timeout'))

    await expect(
      syncLmsPremiumForMasaiLiveLogin({
        user: USER,
        connectSid: 'sid',
      }),
    ).resolves.toBeUndefined()
  })
})
