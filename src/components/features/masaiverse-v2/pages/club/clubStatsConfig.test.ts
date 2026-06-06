import { describe, expect, it } from 'vitest'
import { CLUB_STAT_CARDS, formatClubStat } from './clubStatsConfig'

const stats = {
  activeMembers: 1234,
  avgEventRating: 4.8,
  projectsBuilt: 91,
  communityPosts: 61,
}

const card = (id: string) => {
  const found = CLUB_STAT_CARDS.find((c) => c.id === id)
  if (!found) throw new Error(`missing card ${id}`)
  return found
}

describe('formatClubStat', () => {
  it('renders a dash when stats are unavailable', () => {
    expect(formatClubStat(card('active-members'), undefined)).toBe('—')
  })

  it('renders a dash when the metric value is null', () => {
    expect(
      formatClubStat(card('avg-event-rating'), { ...stats, avgEventRating: null }),
    ).toBe('—')
  })

  it('formats the rating to one decimal', () => {
    expect(formatClubStat(card('avg-event-rating'), stats)).toBe('4.8')
  })

  it('formats counts with locale grouping', () => {
    expect(formatClubStat(card('active-members'), stats)).toBe('1,234')
  })
})
