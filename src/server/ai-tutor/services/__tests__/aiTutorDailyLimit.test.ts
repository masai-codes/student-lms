import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { checkAiTutorDailyLimit } from '../aiTutorDailyLimit'

const { selectMock, fromMock, whereMock, orderByMock } = vi.hoisted(() => {
  const orderByMock = vi.fn()
  const whereMock = vi.fn(() => ({ orderBy: orderByMock }))
  const fromMock = vi.fn(() => ({ where: whereMock }))
  const selectMock = vi.fn(() => ({ from: fromMock }))
  return { selectMock, fromMock, whereMock, orderByMock }
})

vi.mock('@/db', () => ({
  db: { select: selectMock },
}))

beforeEach(() => {
  selectMock.mockClear()
  fromMock.mockClear()
  whereMock.mockClear()
  orderByMock.mockReset()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('checkAiTutorDailyLimit', () => {
  it('returns canProceed=true with remaining count when under the limit', async () => {
    orderByMock.mockResolvedValueOnce([
      { id: 1, rating: 5, feedbackAt: '2026-05-25 10:00:00' },
      { id: 2, rating: null, feedbackAt: null },
    ])

    await expect(
      checkAiTutorDailyLimit({ userId: 1, dailyLimit: 5 }),
    ).resolves.toEqual({
      canProceed: true,
      todayCount: 2,
      message: 'You can start 3 more AI tutor sessions today.',
      lastSessionHasFeedback: true,
    })
  })

  it('returns canProceed=false when user has hit the daily limit', async () => {
    const sessions = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      rating: null,
      feedbackAt: null,
    }))
    orderByMock.mockResolvedValueOnce(sessions)

    await expect(
      checkAiTutorDailyLimit({ userId: 1, dailyLimit: 5 }),
    ).resolves.toMatchObject({
      canProceed: false,
      todayCount: 5,
      lastSessionHasFeedback: false,
    })
  })

  it('returns lastSessionHasFeedback=true when there are no sessions today', async () => {
    orderByMock.mockResolvedValueOnce([])

    await expect(checkAiTutorDailyLimit({ userId: 1 })).resolves.toMatchObject({
      todayCount: 0,
      canProceed: true,
      lastSessionHasFeedback: true,
    })
  })

  it('singular phrasing when exactly one slot remains', async () => {
    orderByMock.mockResolvedValueOnce(
      Array.from({ length: 4 }, (_, i) => ({
        id: i + 1,
        rating: null,
        feedbackAt: null,
      })),
    )

    const result = await checkAiTutorDailyLimit({ userId: 1, dailyLimit: 5 })
    expect(result.message).toBe('You can start 1 more AI tutor session today.')
  })
})
