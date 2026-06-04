// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ClubDetailPage from './ClubDetailPage'
import type { ReactNode } from 'react'
import { ApiClientError } from '@/lib/api/apiClientError'

const { useQuery } = vi.hoisted(() => ({ useQuery: vi.fn() }))

vi.mock('@tanstack/react-query', () => ({ useQuery: () => useQuery() }))
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}))
vi.mock('./club/ClubDetailBanner', () => ({
  default: ({ club }: { club: { name: string } }) => (
    <div data-testid="banner">{club.name}</div>
  ),
}))

afterEach(() => {
  cleanup()
  useQuery.mockReset()
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

  it('renders the banner on success', () => {
    useQuery.mockReturnValue({
      isPending: false,
      error: null,
      data: { name: 'Programming Club' },
    })
    render(<ClubDetailPage clubId="5" />)
    expect(screen.getByTestId('banner').textContent).toBe('Programming Club')
  })
})
