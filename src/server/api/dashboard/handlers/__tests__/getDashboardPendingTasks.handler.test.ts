import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  getDashboardPendingTasks: vi.fn(),
  getUserId: vi.fn(),
}))

vi.mock('@/server/api/dashboard/pending/getDashboardPendingTasks.service', () => ({
  getDashboardPendingTasks: hoisted.getDashboardPendingTasks,
}))
vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getCurrentUserId: hoisted.getUserId,
}))

describe('handleGetDashboardPendingTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getUserId.mockResolvedValue(101)
  })

  it('returns the pending tasks payload when authenticated', async () => {
    const pendingTasks = [
      {
        id: 1,
        learningType: 'assignment',
        title: 'Finish sprint',
        courseName: null,
        enableZoomWebView: false,
      },
    ]
    hoisted.getDashboardPendingTasks.mockResolvedValueOnce(pendingTasks)
    const { handleGetDashboardPendingTasks } = await import(
      '../getDashboardPendingTasks.handler'
    )

    const response = await handleGetDashboardPendingTasks()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ pendingTasks })
    expect(hoisted.getDashboardPendingTasks).toHaveBeenCalledWith(
      101,
      expect.any(Date),
    )
  })

  it('returns 401 when unauthenticated', async () => {
    hoisted.getUserId.mockResolvedValueOnce(null)
    const { handleGetDashboardPendingTasks } = await import(
      '../getDashboardPendingTasks.handler'
    )

    const response = await handleGetDashboardPendingTasks()

    expect(response.status).toBe(401)
  })

  it('maps an unexpected service failure to a 500', async () => {
    hoisted.getDashboardPendingTasks.mockRejectedValueOnce(new Error('boom'))
    const { handleGetDashboardPendingTasks } = await import(
      '../getDashboardPendingTasks.handler'
    )

    const response = await handleGetDashboardPendingTasks()

    expect(response.status).toBe(500)
  })
})
