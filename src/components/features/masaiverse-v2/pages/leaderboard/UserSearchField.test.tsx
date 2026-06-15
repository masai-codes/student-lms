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
import UserSearchField from './UserSearchField'
import type { ReactNode } from 'react'

const { searchUsers } = vi.hoisted(() => ({ searchUsers: vi.fn() }))

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  fetchMasaiverseV2GlobalLeaderboard: vi.fn(),
  searchMasaiverseV2Users: searchUsers,
}))

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

const PRIYA = { id: '10', name: 'Priya', email: 'priya@x.com', avatarUrl: null }

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('UserSearchField', () => {
  it('does not search until the query is at least two characters', () => {
    renderWithClient(<UserSearchField selected={null} onSelect={() => {}} />)
    fireEvent.change(screen.getByLabelText('Search users'), {
      target: { value: 'p' },
    })
    expect(searchUsers).not.toHaveBeenCalled()
    expect(screen.queryByText('No users found')).toBeNull()
  })

  it('lists matches and reports the picked user', async () => {
    const onSelect = vi.fn()
    searchUsers.mockResolvedValue([PRIYA])
    renderWithClient(<UserSearchField selected={null} onSelect={onSelect} />)

    fireEvent.change(screen.getByLabelText('Search users'), {
      target: { value: 'pri' },
    })
    await waitFor(() => expect(screen.getByText('Priya')).toBeTruthy())
    fireEvent.click(screen.getByText('Priya'))
    expect(onSelect).toHaveBeenCalledWith(PRIYA)
  })

  it('shows an empty message when there are no matches', async () => {
    searchUsers.mockResolvedValue([])
    renderWithClient(<UserSearchField selected={null} onSelect={() => {}} />)
    fireEvent.change(screen.getByLabelText('Search users'), {
      target: { value: 'zz' },
    })
    await waitFor(() => expect(screen.getByText('No users found')).toBeTruthy())
  })

  it('collapses to a chip with a clear control once a user is selected', () => {
    const onSelect = vi.fn()
    renderWithClient(<UserSearchField selected={PRIYA} onSelect={onSelect} />)

    expect(screen.getByText('Priya')).toBeTruthy()
    expect(screen.getByText('priya@x.com')).toBeTruthy()
    fireEvent.click(screen.getByText('Change'))
    expect(onSelect).toHaveBeenCalledWith(null)
  })
})
