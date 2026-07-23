import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ fetchJson: vi.fn() }))

vi.mock('@/lib/api/fetchJson', () => ({ fetchJson: hoisted.fetchJson }))

describe('fetchAnnouncements — filter params', () => {
  beforeEach(() => vi.clearAllMocks())

  it('omits type/category params when no filters are selected', async () => {
    hoisted.fetchJson.mockResolvedValueOnce({ announcements: [], total: 0 })
    const { fetchAnnouncements } = await import('../announcementApi')

    await fetchAnnouncements({ page: 1, limit: 15 })

    expect(hoisted.fetchJson).toHaveBeenCalledWith(
      '/api/announcement?page=1&limit=15',
    )
  })

  it('serializes types and categories as comma-separated params', async () => {
    hoisted.fetchJson.mockResolvedValueOnce({ announcements: [], total: 0 })
    const { fetchAnnouncements } = await import('../announcementApi')

    await fetchAnnouncements({
      page: 2,
      limit: 15,
      q: 'react',
      message: true,
      types: ['critical', 'info'],
      categories: ['DSA'],
      announcedBy: ['42', '7'],
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    })

    const url = hoisted.fetchJson.mock.calls[0][0] as string
    const search = new URL(`https://x.test${url}`).searchParams
    expect(search.get('q')).toBe('react')
    expect(search.get('message')).toBe('true')
    expect(search.get('type')).toBe('critical,info')
    expect(search.get('category')).toBe('DSA')
    expect(search.get('announcedBy')).toBe('42,7')
    expect(search.get('startDate')).toBe('2026-07-01')
    expect(search.get('endDate')).toBe('2026-07-31')
  })

  it('does not set type/category when the arrays are empty', async () => {
    hoisted.fetchJson.mockResolvedValueOnce({ announcements: [], total: 0 })
    const { fetchAnnouncements } = await import('../announcementApi')

    await fetchAnnouncements({ page: 1, limit: 15, types: [], categories: [] })

    const url = hoisted.fetchJson.mock.calls[0][0] as string
    expect(url).not.toContain('type=')
    expect(url).not.toContain('category=')
  })

  it('fetchAnnouncementFilterOptions GETs the filter-options endpoint', async () => {
    hoisted.fetchJson.mockResolvedValueOnce({
      categories: ['DSA'],
      announcers: [{ id: '1', name: 'Ada' }],
    })
    const { fetchAnnouncementFilterOptions } = await import('../announcementApi')

    await expect(fetchAnnouncementFilterOptions()).resolves.toEqual({
      categories: ['DSA'],
      announcers: [{ id: '1', name: 'Ada' }],
    })
    expect(hoisted.fetchJson).toHaveBeenCalledWith(
      '/api/announcement/filter-options',
    )
  })
})
