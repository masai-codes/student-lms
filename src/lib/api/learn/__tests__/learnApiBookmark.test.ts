import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ fetchJson: vi.fn() }))

vi.mock('@/lib/api/fetchJson', () => ({
  fetchJson: hoisted.fetchJson,
}))

describe('lecture bookmark client wrappers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('addLectureBookmarkViaApi POSTs to the lecture bookmark endpoint', async () => {
    hoisted.fetchJson.mockResolvedValueOnce({ isBookmarked: true })
    const { addLectureBookmarkViaApi } = await import('../learnApi')

    const result = await addLectureBookmarkViaApi(572)

    expect(result).toEqual({ isBookmarked: true })
    expect(hoisted.fetchJson).toHaveBeenCalledWith(
      '/api/learn/lectures/572/bookmark',
      { method: 'POST' },
    )
  })

  it('removeLectureBookmarkViaApi DELETEs the lecture bookmark endpoint', async () => {
    hoisted.fetchJson.mockResolvedValueOnce({ isBookmarked: false })
    const { removeLectureBookmarkViaApi } = await import('../learnApi')

    const result = await removeLectureBookmarkViaApi(572)

    expect(result).toEqual({ isBookmarked: false })
    expect(hoisted.fetchJson).toHaveBeenCalledWith(
      '/api/learn/lectures/572/bookmark',
      { method: 'DELETE' },
    )
  })
})
