// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import LeaderboardRow from './LeaderboardRow'
import type { LeaderboardRowEntry } from './LeaderboardRow'

const base: LeaderboardRowEntry = {
  rank: 1,
  userId: '10',
  name: 'Priya Rajan',
  avatarUrl: null,
  points: 940,
}

afterEach(cleanup)

describe('LeaderboardRow', () => {
  it('shows a medal, initials, name and points for the top rank', () => {
    render(<LeaderboardRow entry={base} />)
    expect(screen.getByText('🥇')).toBeTruthy()
    expect(screen.getByText('PR')).toBeTruthy()
    expect(screen.getByText('Priya Rajan')).toBeTruthy()
    expect(screen.getByText('940')).toBeTruthy()
    expect(screen.getByText('pts')).toBeTruthy()
    expect(screen.queryByText('You')).toBeNull()
  })

  it('shows the numeric rank beyond the top three', () => {
    render(<LeaderboardRow entry={{ ...base, rank: 4 }} />)
    expect(screen.getByText('4')).toBeTruthy()
  })

  it('labels the signed-in member with "You"', () => {
    render(<LeaderboardRow entry={{ ...base, rank: 9 }} isCurrentUser />)
    expect(screen.getByText('You')).toBeTruthy()
  })

  it('renders an avatar image when the member has a photo', () => {
    render(<LeaderboardRow entry={{ ...base, avatarUrl: 'https://cdn/p.jpg' }} />)
    expect(screen.getByText('PR')).toBeTruthy()
  })

  it('formats large point totals with separators', () => {
    render(<LeaderboardRow entry={{ ...base, points: 12345 }} />)
    expect(screen.getByText('12,345')).toBeTruthy()
  })
})
