// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import MyClubsSection from './MyClubsSection'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}))

afterEach(cleanup)

describe('MyClubsSection', () => {
  it('shows a skeleton while loading', () => {
    render(<MyClubsSection clubs={[]} isLoading />)
    expect(screen.getByLabelText('Loading your clubs')).toBeTruthy()
  })

  it('shows an empty message when the user has no clubs', () => {
    render(<MyClubsSection clubs={[]} />)
    expect(screen.getByText(/haven't joined any clubs/i)).toBeTruthy()
  })

  it('renders a club image when present and initials otherwise', () => {
    render(
      <MyClubsSection
        clubs={[
          { id: '1', name: 'Programming Club', imageUrl: 'https://cdn/c.png' },
          { id: '2', name: 'Design Circle', imageUrl: null },
        ]}
      />,
    )
    expect(
      screen.getByAltText<HTMLImageElement>('Programming Club').getAttribute('src'),
    ).toBe('https://cdn/c.png')
    expect(screen.getByText('DC')).toBeTruthy()
  })
})
