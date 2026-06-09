// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import LeaderboardList from './LeaderboardList'

const entry = (rank: number, name: string) => ({
  rank,
  userId: String(rank),
  name,
  avatarUrl: null,
  points: 100 - rank,
})

afterEach(cleanup)

describe('LeaderboardList', () => {
  it('renders the top entries with no current user', () => {
    render(
      <LeaderboardList
        entries={[entry(1, 'Priya'), entry(2, 'Arjun')]}
        currentUser={null}
      />,
    )
    expect(screen.getByText('Priya')).toBeTruthy()
    expect(screen.getByText('Arjun')).toBeTruthy()
    expect(screen.queryByText('You')).toBeNull()
  })

  it('highlights the current user in place when they are in the top list', () => {
    const me = { ...entry(2, 'Arjun'), userId: '2' }
    render(
      <LeaderboardList entries={[entry(1, 'Priya'), me]} currentUser={me} />,
    )
    // Only one "Arjun" row — no extra pinned row, just the highlight.
    expect(screen.getAllByText('Arjun')).toHaveLength(1)
    expect(screen.getByText('You')).toBeTruthy()
    expect(screen.queryByText('···')).toBeNull()
  })

  it('pins the current user below a separator when off the top list', () => {
    render(
      <LeaderboardList
        entries={[entry(1, 'Priya')]}
        currentUser={{ ...entry(42, 'Vidit'), userId: '99' }}
      />,
    )
    expect(screen.getByText('Priya')).toBeTruthy()
    expect(screen.getByText('Vidit')).toBeTruthy()
    expect(screen.getByText('You')).toBeTruthy()
    expect(screen.getByText('···')).toBeTruthy()
  })
})
