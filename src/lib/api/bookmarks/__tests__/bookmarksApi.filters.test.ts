import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmptyBookmarkFilters } from '@/components/features/bookmarks/bookmarksFilterConfig'

const hoisted = vi.hoisted(() => ({ fetchJson: vi.fn() }))

vi.mock('@/lib/api/fetchJson', () => ({ fetchJson: hoisted.fetchJson }))

describe('fetchBookmarks — filter params', () => {
  beforeEach(() => vi.clearAllMocks())

  it('omits filter params when nothing is selected', async () => {
    hoisted.fetchJson.mockResolvedValueOnce({ bookmarks: [], total: 0 })
    const { fetchBookmarks } = await import('../bookmarksApi')
    await fetchBookmarks({ tab: 'lectures', page: 1, limit: 15 })
    expect(hoisted.fetchJson).toHaveBeenCalledWith(
      '/api/bookmarks?tab=lectures&page=1&limit=15',
    )
  })

  it('serializes each active filter dimension', async () => {
    hoisted.fetchJson.mockResolvedValueOnce({ bookmarks: [], total: 0 })
    const { fetchBookmarks } = await import('../bookmarksApi')
    await fetchBookmarks({
      tab: 'tickets',
      page: 2,
      limit: 15,
      q: 'bug',
      filters: {
        ...createEmptyBookmarkFilters(),
        categories: ['Billing'],
        statuses: ['open', 'closed'],
        priorities: ['high'],
        startDate: '2026-07-01',
        endDate: '2026-07-31',
      },
    })
    const url = hoisted.fetchJson.mock.calls[0][0] as string
    const s = new URL(`https://x.test${url}`).searchParams
    expect(s.get('q')).toBe('bug')
    expect(s.get('category')).toBe('Billing')
    expect(s.get('status')).toBe('open,closed')
    expect(s.get('priority')).toBe('high')
    expect(s.get('startDate')).toBe('2026-07-01')
    expect(s.get('endDate')).toBe('2026-07-31')
  })

  it('does not set empty arrays', async () => {
    hoisted.fetchJson.mockResolvedValueOnce({ bookmarks: [], total: 0 })
    const { fetchBookmarks } = await import('../bookmarksApi')
    await fetchBookmarks({
      tab: 'lectures',
      page: 1,
      limit: 15,
      filters: createEmptyBookmarkFilters(),
    })
    const url = hoisted.fetchJson.mock.calls[0][0] as string
    expect(url).not.toContain('category=')
    expect(url).not.toContain('startDate=')
  })

  it('fetchBookmarkFilterOptions GETs the options endpoint per tab', async () => {
    hoisted.fetchJson.mockResolvedValueOnce({
      categories: ['DSA'],
      modules: [],
      statuses: [],
      priorities: [],
    })
    const { fetchBookmarkFilterOptions } = await import('../bookmarksApi')
    await fetchBookmarkFilterOptions('lectures')
    expect(hoisted.fetchJson).toHaveBeenCalledWith(
      '/api/bookmarks/filter-options?tab=lectures',
    )
  })
})
