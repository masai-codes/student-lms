import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  getSectionIds: vi.fn(),
  getCutoff: vi.fn(),
  getSectionAnnouncements: vi.fn(),
  getForYouMessages: vi.fn(),
}))

vi.mock('@/server/batches/getSectionIdsForUser', () => ({
  getSectionIdsForUser: hoisted.getSectionIds,
}))
vi.mock('@/server/users/getBannedContentCutoffForUser', () => ({
  getBannedContentCutoffForUser: hoisted.getCutoff,
}))
vi.mock('../getSectionAnnouncements.service', () => ({
  getSectionAnnouncements: hoisted.getSectionAnnouncements,
}))
vi.mock('../getForYouMessages.service', () => ({
  getForYouMessages: hoisted.getForYouMessages,
}))

const ranked = (id: number, source: 'a' | 'm', sortedAt: string) => ({
  sortedAt,
  item: {
    id,
    source,
    title: `${source}${id}`,
    body: '',
    authorName: null,
    isForYou: source === 'm',
    ctaName: null,
    ctaLink: null,
  },
})

describe('getAnnouncementsFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getSectionIds.mockResolvedValue([5])
    hoisted.getCutoff.mockResolvedValue(null)
  })

  it('combines both feeds sorted newest-first and capped at 5', async () => {
    hoisted.getSectionAnnouncements.mockResolvedValueOnce([
      ranked(1, 'a', '2026-07-01 09:00:00'),
      ranked(2, 'a', '2026-07-05 09:00:00'),
    ])
    hoisted.getForYouMessages.mockResolvedValueOnce([ranked(3, 'm', '2026-07-03 09:00:00')])
    const { getAnnouncementsFeed } = await import('../getAnnouncementsFeed.service')

    const now = new Date('2026-07-02T06:30:00Z')
    const result = await getAnnouncementsFeed(42, now)

    expect(result.map((r) => `${r.source}${r.id}`)).toEqual(['a2', 'm3', 'a1'])
    // Feed A receives the resolved section ids + IST now + cutoff.
    expect(hoisted.getSectionAnnouncements).toHaveBeenCalledWith(
      [5],
      42,
      '2026-07-02 12:00:00',
      null,
    )
    expect(hoisted.getForYouMessages).toHaveBeenCalledWith(42, '2026-07-02 12:00:00', null)
  })
})
