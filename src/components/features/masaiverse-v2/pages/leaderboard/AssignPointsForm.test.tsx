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
import AssignPointsForm, {
  pointsInvalidationKeys,
  resolveClubId,
} from './AssignPointsForm'
import type { ReactNode } from 'react'

const { award, searchUsers, fetchMyClubs } = vi.hoisted(() => ({
  award: vi.fn(),
  searchUsers: vi.fn(),
  fetchMyClubs: vi.fn(),
}))

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  fetchMasaiverseV2GlobalLeaderboard: vi.fn(),
  awardMasaiverseV2Points: award,
  searchMasaiverseV2Users: searchUsers,
  fetchMasaiverseV2ClubDetail: vi.fn(),
  fetchMasaiverseV2ClubEditData: vi.fn(),
  fetchMasaiverseV2ClubEvents: vi.fn(),
  fetchMasaiverseV2ClubLeaderboard: vi.fn(),
  fetchMasaiverseV2ClubStats: vi.fn(),
  fetchMasaiverseV2MyClubs: fetchMyClubs,
}))

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

const PRIYA = { id: '10', name: 'Priya', email: 'priya@x.com', avatarUrl: null }

async function pickUser() {
  fireEvent.change(screen.getByLabelText('Search users'), {
    target: { value: 'pri' },
  })
  await waitFor(() => expect(screen.getByText('Priya')).toBeTruthy())
  fireEvent.click(screen.getByText('Priya'))
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('AssignPointsForm helpers', () => {
  it('resolves the club dropdown sentinel to null', () => {
    expect(resolveClubId('none')).toBeNull()
    expect(resolveClubId('5')).toBe('5')
  })

  it('builds the leaderboard keys to refetch', () => {
    expect(pointsInvalidationKeys('none')).toEqual([
      ['masaiverse-v2', 'global-leaderboard'],
    ])
    expect(pointsInvalidationKeys('5')).toEqual([
      ['masaiverse-v2', 'global-leaderboard'],
      ['masaiverse-v2', 'club', '5'],
    ])
  })
})

describe('AssignPointsForm', () => {
  it('keeps submit disabled until a user and non-zero points are set', async () => {
    searchUsers.mockResolvedValue([PRIYA])
    fetchMyClubs.mockResolvedValue([])
    renderWithClient(<AssignPointsForm onDone={() => {}} />)

    const submit = screen.getByRole('button', { name: 'Assign points' })
    expect(submit).toHaveProperty('disabled', true)

    await pickUser()
    fireEvent.change(screen.getByLabelText('Points'), {
      target: { value: '50' },
    })
    expect(submit).toHaveProperty('disabled', false)
  })

  it('awards community-wide points and closes on success', async () => {
    const onDone = vi.fn()
    searchUsers.mockResolvedValue([PRIYA])
    fetchMyClubs.mockResolvedValue([])
    award.mockResolvedValue({ id: '1' })
    renderWithClient(<AssignPointsForm onDone={onDone} />)

    await pickUser()
    fireEvent.change(screen.getByLabelText('Points'), {
      target: { value: '50' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Assign points' }))

    await waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(award).toHaveBeenCalledWith({
      targetUserId: '10',
      points: 50,
      clubId: null,
    })
  })

  it('surfaces an error when the award fails', async () => {
    searchUsers.mockResolvedValue([PRIYA])
    fetchMyClubs.mockResolvedValue([])
    award.mockRejectedValue(new Error('boom'))
    renderWithClient(<AssignPointsForm onDone={() => {}} />)

    await pickUser()
    fireEvent.change(screen.getByLabelText('Points'), {
      target: { value: '5' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Assign points' }))

    await waitFor(() =>
      expect(screen.getByText(/Couldn't assign points/i)).toBeTruthy(),
    )
  })
})
