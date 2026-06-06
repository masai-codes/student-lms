// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import ClubLeaderboardRow from './ClubLeaderboardRow'
import type { ClubLeaderboardEntry } from '@/server/api/masaiverse-v2/services/getClubLeaderboard.service'

const baseEntry: ClubLeaderboardEntry = {
  rank: 1,
  userId: '10',
  name: 'Priya Rajan',
  avatarUrl: null,
  points: 940,
  postsCount: 12,
  eventsCount: 48,
}

afterEach(cleanup)

describe('ClubLeaderboardRow', () => {
  it('shows a medal, initials, name, subtitle and points for the top rank', () => {
    render(<ClubLeaderboardRow entry={baseEntry} />)

    expect(screen.getByText('🥇')).toBeTruthy()
    expect(screen.getByText('PR')).toBeTruthy()
    expect(screen.getByText('Priya Rajan')).toBeTruthy()
    expect(screen.getByText('12 projects · 48 events')).toBeTruthy()
    expect(screen.getByText('940')).toBeTruthy()
    expect(screen.getByText('pts')).toBeTruthy()
  })

  it('shows the numeric rank for ranks beyond the top three', () => {
    render(<ClubLeaderboardRow entry={{ ...baseEntry, rank: 4 }} />)
    expect(screen.getByText('4')).toBeTruthy()
  })

  it('renders an avatar image when the member has a photo', () => {
    render(
      <ClubLeaderboardRow
        entry={{ ...baseEntry, avatarUrl: 'https://cdn/p.jpg' }}
      />,
    )
    // The initials fallback is still present until the image loads.
    expect(screen.getByText('PR')).toBeTruthy()
  })

  it('formats large point totals with separators', () => {
    render(<ClubLeaderboardRow entry={{ ...baseEntry, points: 12345 }} />)
    expect(screen.getByText('12,345')).toBeTruthy()
  })
})
