// @vitest-environment jsdom
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import JoinClubButton from './JoinClubButton'
import type { ReactNode } from 'react'
import { masaiverseV2ClubDetailQuery } from '@/query/masaiverse-v2/clubsQuery'
import {
  fetchMasaiverseV2ClubDetail,
  setMasaiverseV2ClubMembership,
} from '@/lib/api/masaiverse-v2/masaiverseV2Api'

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  setMasaiverseV2ClubMembership: vi.fn(),
  fetchMasaiverseV2ClubDetail: vi.fn(),
}))

const mockedSet = vi.mocked(setMasaiverseV2ClubMembership)
const mockedFetchDetail = vi.mocked(fetchMasaiverseV2ClubDetail)

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function renderWithClient(node: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  queryClient.setQueryData(masaiverseV2ClubDetailQuery('5').queryKey, {
    id: '5',
    name: 'Programming Club',
    imageUrl: null,
    bannerSubtitle: null,
    bannerTags: [],
    aboutDescription: null,
    aboutDetails: [],
    learningTenureDateText: null,
    learningTenure: [],
    galleryImages: [],
    memberCount: 234,
    isJoined: false,
    confirmationModalText: null,
  })
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>{node}</QueryClientProvider>,
    ),
  }
}

describe('JoinClubButton', () => {
  it('renders "Join" when not a member', () => {
    renderWithClient(<JoinClubButton clubId="5" isJoined={false} />)
    expect(screen.getByRole('button', { name: 'Join' })).toBeTruthy()
  })

  it('uses the filled-orange pill for the primary variant', () => {
    renderWithClient(
      <JoinClubButton clubId="5" isJoined={false} variant="primary" />,
    )
    const button = screen.getByRole('button', { name: 'Join' })
    expect(button.className).toContain('bg-masaiverse-orange')
    expect(button.className).not.toContain('bg-white')
  })

  it('opens a confirmation dialog and only joins after acknowledging', async () => {
    mockedSet.mockResolvedValue({ isJoined: true, memberCount: 235 })
    renderWithClient(
      <JoinClubButton
        clubId="5"
        isJoined={false}
        confirmationModalText="By joining you accept the **rules**."
      />,
    )

    // Clicking Join opens the dialog instead of calling the API.
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Join' }))
    })
    expect(screen.getByText('Confirm joining this club')).toBeTruthy()
    expect(screen.getByText('rules')).toBeTruthy()
    expect(mockedSet).not.toHaveBeenCalled()

    // The confirm action stays disabled until the checkbox is ticked.
    const confirmButton = screen.getByRole('button', { name: 'Confirm & join' })
    expect((confirmButton as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole('checkbox'))
    expect((confirmButton as HTMLButtonElement).disabled).toBe(false)

    await act(async () => {
      fireEvent.click(confirmButton)
    })
    expect(mockedSet).toHaveBeenCalledWith({ clubId: '5', join: true })
  })

  it('joins and writes the new state into the detail query cache', async () => {
    mockedSet.mockResolvedValue({ isJoined: true, memberCount: 235 })
    const { queryClient } = renderWithClient(
      <JoinClubButton clubId="5" isJoined={false} />,
    )

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Join' }))
    })

    expect(mockedSet).toHaveBeenCalledWith({ clubId: '5', join: true })
    await waitFor(() => {
      const cached = queryClient.getQueryData(
        masaiverseV2ClubDetailQuery('5').queryKey,
      )
      expect(cached).toMatchObject({ isJoined: true, memberCount: 235 })
    })
  })

  it('stays "Joined" even when the detail refetch races back stale', async () => {
    // Server confirms the join…
    mockedSet.mockResolvedValue({ isJoined: true, memberCount: 235 })
    // …but the immediate detail refetch races the write and returns the old,
    // not-yet-joined state. The button must not snap back to "Join".
    mockedFetchDetail.mockResolvedValue({
      id: '5',
      name: 'Programming Club',
      imageUrl: null,
      bannerSubtitle: null,
      bannerTags: [],
      aboutDescription: null,
      aboutDetails: [],
      learningTenureDateText: null,
      learningTenure: [],
      galleryImages: [],
      memberCount: 234,
      isJoined: false,
      stats: null,
      events: { weeklyConnects: [], upcoming: [], past: [] },
      leaderboard: {
        entries: [],
        page: 1,
        perPage: 5,
        total: 0,
        hasMore: false,
      },
      discussions: [],
    })

    // A live, mounted detail query so invalidate() actually refetches, and the
    // button is driven by that query's data — exactly like the real page.
    function Harness() {
      const { data } = useQuery(masaiverseV2ClubDetailQuery('5'))
      if (!data) return null
      return <JoinClubButton clubId="5" isJoined={data.isJoined} />
    }

    const { queryClient } = renderWithClient(<Harness />)

    await act(async () => {
      fireEvent.click(await screen.findByRole('button', { name: 'Join' }))
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Joined' })).toBeTruthy()
    })
    const cached = queryClient.getQueryData(
      masaiverseV2ClubDetailQuery('5').queryKey,
    )
    expect(cached).toMatchObject({ isJoined: true, memberCount: 235 })
  })

  it('does not allow leaving once joined', async () => {
    renderWithClient(<JoinClubButton clubId="5" isJoined />)

    const button = screen.getByRole('button', { name: 'Joined' })
    expect(button.hasAttribute('disabled')).toBe(true)

    await act(async () => {
      fireEvent.click(button)
    })

    expect(mockedSet).not.toHaveBeenCalled()
  })
})
