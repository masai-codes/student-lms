// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ClubDetailPage from './ClubDetailPage'
import type { ReactNode } from 'react'
import { ApiClientError } from '@/lib/api/apiClientError'

const { useQuery, recordVisit } = vi.hoisted(() => ({
  useQuery: vi.fn(),
  recordVisit: vi.fn(),
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => useQuery(),
  // The edit provider grabs the query client to refetch after saves.
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}))
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
  useNavigate: () => vi.fn(),
  useRouter: () => ({ history: { back: vi.fn() } }),
  useCanGoBack: () => false,
}))
vi.mock('./club/ClubDetailBanner', () => ({
  default: ({ club }: { club: { name: string } }) => (
    <div data-testid="banner">{club.name}</div>
  ),
}))
vi.mock('./club/ClubStatsSection', () => ({
  default: ({ clubId }: { clubId: string }) => (
    <div data-testid="stats">{clubId}</div>
  ),
}))
vi.mock('./club/AboutClubSection', () => ({
  default: ({ club }: { club: { name: string } }) => (
    <div data-testid="about">{club.name}</div>
  ),
}))
vi.mock('./club/WeeklyConnectsSection', () => ({
  default: ({ clubId }: { clubId: string }) => (
    <div data-testid="weekly">{clubId}</div>
  ),
}))
vi.mock('./club/ClubUpcomingSection', () => ({
  default: ({ clubId }: { clubId: string }) => (
    <div data-testid="upcoming">{clubId}</div>
  ),
}))
vi.mock('./club/ClubPastSection', () => ({
  default: ({ clubId }: { clubId: string }) => (
    <div data-testid="past">{clubId}</div>
  ),
}))
vi.mock('./club/LearningTenureSection', () => ({
  default: ({ club }: { club: { name: string } }) => (
    <div data-testid="learning">{club.name}</div>
  ),
}))
vi.mock('./club/ClubPhotosSection', () => ({
  default: ({ club }: { club: { name: string } }) => (
    <div data-testid="photos">{club.name}</div>
  ),
}))
vi.mock('./club/ClubLeaderboardSection', () => ({
  default: ({ clubId }: { clubId: string }) => (
    <div data-testid="leaderboard">{clubId}</div>
  ),
}))
vi.mock('./club/ClubDiscussionsSection', () => ({
  default: ({ clubId }: { clubId: string }) => (
    <div data-testid="discussions">{clubId}</div>
  ),
}))
vi.mock('./club/LockedSection', () => ({
  default: ({ title }: { title: string }) => (
    <div data-testid="locked">{title}</div>
  ),
}))
vi.mock('./home/calendar/CalendarPanel', () => ({
  default: () => <div data-testid="calendar-panel" />,
}))
vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  recordMasaiverseV2ClubVisit: recordVisit,
  // The page is wrapped in the edit provider; default to a non-admin so the
  // edit affordances stay hidden and these tests see the read-only page.
  fetchMasaiverseV2AdminMode: vi.fn().mockResolvedValue({
    isAdmin: false,
    enabled: false,
  }),
  updateMasaiverseV2Event: vi.fn(),
  updateMasaiverseV2Club: vi.fn(),
}))

afterEach(() => {
  cleanup()
  useQuery.mockReset()
  recordVisit.mockReset()
})

describe('ClubDetailPage', () => {
  it('shows a loading state while the query is pending', () => {
    useQuery.mockReturnValue({ isPending: true })
    render(<ClubDetailPage clubId="5" />)
    expect(screen.getByLabelText('Loading club')).toBeTruthy()
  })

  it('shows a "not found" message on a 404', () => {
    useQuery.mockReturnValue({
      isPending: false,
      error: new ApiClientError(404, { code: 'CLUB_NOT_FOUND' }),
    })
    render(<ClubDetailPage clubId="5" />)
    expect(screen.getByText('Club not found')).toBeTruthy()
    expect(screen.getByText(/id "5"/)).toBeTruthy()
  })

  it('shows a generic error for non-404 failures', () => {
    useQuery.mockReturnValue({ isPending: false, error: new Error('boom') })
    render(<ClubDetailPage clubId="5" />)
    expect(screen.getByText('Something went wrong')).toBeTruthy()
  })

  it('renders the banner and stats section on success', () => {
    useQuery.mockReturnValue({
      isPending: false,
      error: null,
      data: { name: 'Programming Club', isJoined: false },
    })
    render(<ClubDetailPage clubId="5" />)
    expect(screen.getByTestId('banner').textContent).toBe('Programming Club')
    expect(screen.getByTestId('stats').textContent).toBe('5')
  })

  it('shows event sections but blurs leaderboard + discussion for a non-member', () => {
    useQuery.mockReturnValue({
      isPending: false,
      error: null,
      data: { name: 'Programming Club', isJoined: false },
    })
    render(<ClubDetailPage clubId="5" />)

    // Events are visible to everyone so non-members can browse the schedule.
    expect(screen.getByTestId('weekly').textContent).toBe('5')
    expect(screen.getByTestId('upcoming').textContent).toBe('5')
    expect(screen.getByTestId('past').textContent).toBe('5')

    // Only the leaderboard and discussion stay locked behind membership.
    const locked = screen.getAllByTestId('locked').map((el) => el.textContent)
    expect(locked).toEqual(['Club Leaderboard', 'Club Discussion'])
    expect(screen.queryByTestId('leaderboard')).toBeNull()
    expect(screen.queryByTestId('discussions')).toBeNull()
  })

  it('renders the real member-only sections for a member', () => {
    recordVisit.mockResolvedValue({ recorded: true })
    useQuery.mockReturnValue({
      isPending: false,
      error: null,
      data: { name: 'Programming Club', isJoined: true },
    })
    render(<ClubDetailPage clubId="5" />)

    expect(screen.queryByTestId('locked')).toBeNull()
    expect(screen.getByTestId('weekly').textContent).toBe('5')
    expect(screen.getByTestId('upcoming').textContent).toBe('5')
    expect(screen.getByTestId('past').textContent).toBe('5')
    expect(screen.getByTestId('leaderboard').textContent).toBe('5')
    expect(screen.getByTestId('discussions').textContent).toBe('5')
  })

  it('records a visit when the user is a member', async () => {
    recordVisit.mockResolvedValue({ recorded: true })
    useQuery.mockReturnValue({
      isPending: false,
      error: null,
      data: { name: 'Programming Club', isJoined: true },
    })
    render(<ClubDetailPage clubId="5" />)
    await waitFor(() => expect(recordVisit).toHaveBeenCalledWith('5'))
  })

  it('does not record a visit when the user is not a member', () => {
    useQuery.mockReturnValue({
      isPending: false,
      error: null,
      data: { name: 'Programming Club', isJoined: false },
    })
    render(<ClubDetailPage clubId="5" />)
    expect(recordVisit).not.toHaveBeenCalled()
  })
})
