// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
import { setMasaiverseV2ClubMembership } from '@/lib/api/masaiverse-v2/masaiverseV2Api'

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  setMasaiverseV2ClubMembership: vi.fn(),
}))

const mockedSet = vi.mocked(setMasaiverseV2ClubMembership)

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

  it('leaves the club when already joined', async () => {
    mockedSet.mockResolvedValue({ isJoined: false, memberCount: 233 })
    renderWithClient(<JoinClubButton clubId="5" isJoined />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Joined' }))
    })

    expect(mockedSet).toHaveBeenCalledWith({ clubId: '5', join: false })
  })
})
