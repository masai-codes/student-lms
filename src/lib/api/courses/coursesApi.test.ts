import { describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ fetchJson: vi.fn() }))
vi.mock('@/lib/api/fetchJson', () => ({ fetchJson: hoisted.fetchJson }))

describe('fetchMyCourses', () => {
  it('GETs the listing endpoint and returns the parsed body', async () => {
    const data = { active: [], cancelled: [] }
    hoisted.fetchJson.mockResolvedValue(data)

    const { fetchMyCourses } = await import('./coursesApi')

    await expect(fetchMyCourses()).resolves.toBe(data)
    expect(hoisted.fetchJson).toHaveBeenCalledWith('/api/courses')
  })
})
