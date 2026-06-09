// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import LeaderboardPage from './LeaderboardPage'

const { useQuery } = vi.hoisted(() => ({ useQuery: vi.fn() }))

vi.mock('@tanstack/react-query', () => ({ useQuery: () => useQuery() }))

// Stub the two leaderboard sections so the test asserts how the page wires and
// scopes each tab, without pulling in their own queries.
vi.mock('./leaderboard/GlobalLeaderboardSection', () => ({
  default: () => <div data-testid="global-board">global</div>,
}))
vi.mock('./leaderboard/AssignPointsButton', () => ({
  default: () => <div data-testid="assign-points" />,
}))
vi.mock('./club/ClubLeaderboardSection', () => ({
  default: ({ clubId }: { clubId: string }) => (
    <div data-testid="club-board" data-club-id={clubId}>
      club
    </div>
  ),
}))

const CLUBS = [
  { id: '1', name: 'Programming Club', imageUrl: null },
  { id: '2', name: 'Design Club', imageUrl: null },
]

afterEach(() => {
  cleanup()
  useQuery.mockReset()
})

describe('LeaderboardPage', () => {
  it('shows only the Global tab while clubs are loading', () => {
    useQuery.mockReturnValue({ data: undefined, isPending: true })
    render(<LeaderboardPage />)

    expect(screen.getByRole('tab', { name: 'Global leaderboard' })).toBeTruthy()
    expect(screen.queryByRole('tab', { name: 'Programming Club' })).toBeNull()
    expect(screen.getByLabelText('Loading your clubs')).toBeTruthy()
  })

  it('renders the global board by default', () => {
    useQuery.mockReturnValue({ data: CLUBS, isPending: false })
    render(<LeaderboardPage />)

    expect(screen.getByTestId('global-board')).toBeTruthy()
    expect(screen.queryByTestId('club-board')).toBeNull()
  })

  it('renders a tab for each joined club', () => {
    useQuery.mockReturnValue({ data: CLUBS, isPending: false })
    render(<LeaderboardPage />)

    expect(screen.getByRole('tab', { name: 'Programming Club' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Design Club' })).toBeTruthy()
    expect(screen.queryByLabelText('Loading your clubs')).toBeNull()
  })

  it('scopes the board to a club when its tab is selected', () => {
    useQuery.mockReturnValue({ data: CLUBS, isPending: false })
    render(<LeaderboardPage />)

    // Radix Tabs uses automatic activation, so focusing the tab selects it.
    fireEvent.focus(screen.getByRole('tab', { name: 'Design Club' }))

    const board = screen.getByTestId('club-board')
    expect(board.getAttribute('data-club-id')).toBe('2')
  })

  it('shows only the Global tab when the user has joined no clubs', () => {
    useQuery.mockReturnValue({ data: [], isPending: false })
    render(<LeaderboardPage />)

    expect(screen.getAllByRole('tab')).toHaveLength(1)
    expect(screen.getByRole('tab', { name: 'Global leaderboard' })).toBeTruthy()
  })
})
