// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DiscussionsPage from './DiscussionsPage'

const { useQuery } = vi.hoisted(() => ({ useQuery: vi.fn() }))

vi.mock('@tanstack/react-query', () => ({ useQuery: () => useQuery() }))

// Stub the shared feed so the test asserts how the page scopes each tab,
// without pulling in the infinite-query / network machinery.
vi.mock('./home/CommunityDiscussionsSection', () => ({
  default: ({
    clubId,
    title,
    hideViewAllLink,
  }: {
    clubId?: string
    title?: string
    hideViewAllLink?: boolean
  }) => (
    <div
      data-testid="feed"
      data-club-id={clubId ?? ''}
      data-hide-view-all={String(Boolean(hideViewAllLink))}
    >
      {title}
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

describe('DiscussionsPage', () => {
  it('shows only the Public tab while clubs are loading', () => {
    useQuery.mockReturnValue({ data: undefined, isPending: true })
    render(<DiscussionsPage />)

    expect(screen.getByRole('tab', { name: 'Public' })).toBeTruthy()
    expect(screen.queryByRole('tab', { name: 'Programming Club' })).toBeNull()
    expect(screen.getByLabelText('Loading your clubs')).toBeTruthy()
  })

  it('renders the public feed (club-less, no "view all") by default', () => {
    useQuery.mockReturnValue({ data: CLUBS, isPending: false })
    render(<DiscussionsPage />)

    const feed = screen.getByTestId('feed')
    expect(feed.getAttribute('data-club-id')).toBe('')
    expect(feed.getAttribute('data-hide-view-all')).toBe('true')
    expect(feed.textContent).toBe('Public Discussions')
  })

  it('renders a tab for each joined club', () => {
    useQuery.mockReturnValue({ data: CLUBS, isPending: false })
    render(<DiscussionsPage />)

    expect(screen.getByRole('tab', { name: 'Programming Club' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Design Club' })).toBeTruthy()
    expect(screen.queryByLabelText('Loading your clubs')).toBeNull()
  })

  it('scopes the feed to a club when its tab is selected', () => {
    useQuery.mockReturnValue({ data: CLUBS, isPending: false })
    render(<DiscussionsPage />)

    // Radix Tabs uses automatic activation, so focusing the tab selects it.
    fireEvent.focus(screen.getByRole('tab', { name: 'Design Club' }))

    const feed = screen.getByTestId('feed')
    expect(feed.getAttribute('data-club-id')).toBe('2')
    expect(feed.textContent).toBe('Design Club')
  })

  it('shows only the Public tab when the user has joined no clubs', () => {
    useQuery.mockReturnValue({ data: [], isPending: false })
    render(<DiscussionsPage />)

    expect(screen.getAllByRole('tab')).toHaveLength(1)
    expect(screen.getByRole('tab', { name: 'Public' })).toBeTruthy()
  })
})
