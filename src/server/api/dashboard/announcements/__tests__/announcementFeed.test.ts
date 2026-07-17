import { describe, expect, it } from 'vitest'
import { combineAnnouncementFeeds } from '../announcementFeed'
import type { RankedAnnouncement } from '../announcementFeed'

const ranked = (id: number, sortedAt: string | null): RankedAnnouncement => ({
  sortedAt,
  item: {
    id,
    source: 'a',
    title: `A${id}`,
    body: '',
    authorName: null,
    isForYou: false,
    ctaName: null,
    ctaLink: null,
  },
})

describe('combineAnnouncementFeeds', () => {
  it('merges feeds and sorts newest-first by sortedAt', () => {
    const feedA = [
      ranked(1, '2026-07-01 09:00:00'),
      ranked(2, '2026-07-03 09:00:00'),
    ]
    const feedB = [ranked(3, '2026-07-02 09:00:00')]

    const result = combineAnnouncementFeeds([feedA, feedB])
    expect(result.map((r) => r.id)).toEqual([2, 3, 1])
  })

  it('caps the result at the limit', () => {
    const feed = Array.from({ length: 8 }, (_, i) =>
      ranked(i, `2026-07-0${(i % 8) + 1} 09:00:00`),
    )
    expect(combineAnnouncementFeeds([feed])).toHaveLength(5)
    expect(combineAnnouncementFeeds([feed], 2)).toHaveLength(2)
  })

  it('sorts items with a missing timestamp last', () => {
    const result = combineAnnouncementFeeds([
      [ranked(1, null), ranked(2, '2026-07-02 09:00:00')],
    ])
    expect(result.map((r) => r.id)).toEqual([2, 1])
  })
})
