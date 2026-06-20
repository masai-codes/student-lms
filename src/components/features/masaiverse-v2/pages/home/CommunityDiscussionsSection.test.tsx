// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CommunityDiscussionsSection from './CommunityDiscussionsSection'
import type { ReactNode } from 'react'

const { fetchDiscussions } = vi.hoisted(() => ({ fetchDiscussions: vi.fn() }))

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  fetchMasaiverseV2Discussions: fetchDiscussions,
  createMasaiverseV2Discussion: vi.fn(),
  voteMasaiverseV2Discussion: vi.fn(),
  voteMasaiverseV2Reply: vi.fn(),
  fetchMasaiverseV2DiscussionReplies: vi.fn().mockResolvedValue([]),
  createMasaiverseV2DiscussionReply: vi.fn(),
  banMasaiverseV2Post: vi.fn(),
  banMasaiverseV2Reply: vi.fn(),
  fetchMasaiverseV2AdminMode: vi
    .fn()
    .mockResolvedValue({ isAdmin: false, enabled: false }),
}))
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => children,
}))

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  )
}

const discussion = {
  id: '7',
  title: 'How do you explain your projects?',
  authorName: 'Arjun Pandey',
  tags: ['Career', 'Interviews'],
  upvotes: 24,
  replyCount: 14,
  myVote: null,
  createdAt: '2026-06-03T09:00:00.000Z',
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('CommunityDiscussionsSection', () => {
  it('shows a loading message while fetching', () => {
    fetchDiscussions.mockReturnValue(new Promise(() => {}))
    renderWithClient(<CommunityDiscussionsSection />)
    expect(screen.getByText('Loading discussions…')).toBeTruthy()
  })

  it('renders discussion rows and no "Load more" when hasMore is false', async () => {
    fetchDiscussions.mockResolvedValue({
      discussions: [discussion],
      hasMore: false,
    })
    renderWithClient(<CommunityDiscussionsSection />)

    await waitFor(() =>
      expect(
        screen.getByText('How do you explain your projects?'),
      ).toBeTruthy(),
    )
    expect(screen.getByText('Career')).toBeTruthy()
    expect(screen.getByText('14 replies')).toBeTruthy()
    expect(screen.queryByText('Load more')).toBeNull()
  })

  it('loads the next page when "Load more" is clicked', async () => {
    fetchDiscussions
      .mockResolvedValueOnce({ discussions: [discussion], hasMore: true })
      .mockResolvedValueOnce({
        discussions: [{ ...discussion, id: '8', title: 'Second post' }],
        hasMore: false,
      })
    renderWithClient(<CommunityDiscussionsSection />)

    await waitFor(() => expect(screen.getByText('Load more')).toBeTruthy())
    fireEvent.click(screen.getByText('Load more'))

    await waitFor(() => expect(screen.getByText('Second post')).toBeTruthy())
    expect(fetchDiscussions).toHaveBeenLastCalledWith({
      offset: 5,
      limit: 5,
      q: '',
    })
  })

  it('searches discussions (debounced) by the typed query', async () => {
    fetchDiscussions.mockResolvedValue({ discussions: [], hasMore: false })
    renderWithClient(<CommunityDiscussionsSection />)

    fireEvent.change(
      screen.getByPlaceholderText(
        'Search discussions by title, content or tag…',
      ),
      { target: { value: 'react' } },
    )

    await waitFor(() =>
      expect(fetchDiscussions).toHaveBeenLastCalledWith({
        offset: 0,
        limit: 5,
        q: 'react',
      }),
    )
  })

  it('shows an empty state when there are no discussions', async () => {
    fetchDiscussions.mockResolvedValue({ discussions: [], hasMore: false })
    renderWithClient(<CommunityDiscussionsSection />)

    await waitFor(() =>
      expect(
        screen.getByText('No discussions yet — start the first one!'),
      ).toBeTruthy(),
    )
  })

  it('scopes to a club: passes clubId, uses the title, keeps "View all"', async () => {
    fetchDiscussions.mockResolvedValue({ discussions: [], hasMore: false })
    renderWithClient(
      <CommunityDiscussionsSection clubId="81910" title="Club Discussion" />,
    )

    expect(screen.getByText('Club Discussion')).toBeTruthy()
    // Scoping by clubId alone keeps the "View all" link (it deep-links to the
    // club's discussions tab); only the explicit `hideViewAllLink` removes it.
    expect(screen.getByText('View all →')).toBeTruthy()
    await waitFor(() =>
      expect(fetchDiscussions).toHaveBeenLastCalledWith({
        offset: 0,
        limit: 5,
        q: '',
        clubId: '81910',
      }),
    )
  })
})
