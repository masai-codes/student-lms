// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MasaiverseV2LeftSection from './MasaiverseV2LeftSection'
import type { AnchorHTMLAttributes, ReactNode } from 'react'

const { useRouterState, useQuery } = vi.hoisted(() => ({
  useRouterState: vi.fn(),
  useQuery: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  useRouterState: (opts: { select: (s: unknown) => unknown }) =>
    useRouterState(opts),
  Link: ({
    children,
    className,
  }: {
    children: ReactNode
  } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a className={className}>{children}</a>
  ),
}))

vi.mock('@tanstack/react-query', () => ({ useQuery: () => useQuery() }))

// The admin-mode toggle has its own dedicated test; stub it here so this suite
// stays focused on the sidebar shell and is unaffected by its data fetching.
vi.mock('./AdminModeToggle', () => ({ default: () => null }))

afterEach(() => {
  cleanup()
  useRouterState.mockReset()
  useQuery.mockReset()
})

function mockPathname(pathname: string) {
  useRouterState.mockImplementation(
    (opts: { select: (s: unknown) => unknown }) =>
      opts.select({ location: { pathname } }),
  )
}

describe('MasaiverseV2LeftSection', () => {
  it('renders the centered Masaiverse logo at the top of the sidebar', () => {
    mockPathname('/masaiverse/home')
    useQuery.mockReturnValue({ data: [], isPending: false })
    render(<MasaiverseV2LeftSection />)

    // Light + dark artwork are both in the DOM; CSS (`dark:hidden`) picks one,
    // so jsdom sees the pair. Assert both are wired to the right assets.
    const logos = screen.getAllByAltText<HTMLImageElement>('Masaiverse')
    expect(logos.map((img) => img.getAttribute('src'))).toEqual([
      '/Masaiverse.svg',
      '/masaiverse-dark.svg',
    ])
  })

  it('no longer renders the heading or tagline, but keeps the navigation', () => {
    mockPathname('/masaiverse/home')
    useQuery.mockReturnValue({ data: [], isPending: false })
    render(<MasaiverseV2LeftSection />)

    expect(screen.queryByText('MasaiVerse')).toBeNull()
    expect(screen.queryByText('Your learning community')).toBeNull()
    expect(screen.getByText('My Clubs')).toBeTruthy()
  })

  it('renders the live "My Clubs" list returned by the query', () => {
    mockPathname('/masaiverse/home')
    useQuery.mockReturnValue({
      data: [{ id: '5', name: 'Programming Club', imageUrl: null }],
      isPending: false,
    })
    render(<MasaiverseV2LeftSection />)

    expect(screen.getByText('Programming Club')).toBeTruthy()
  })
})
