// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import MasaiverseLoader from './MasaiverseLoader'

afterEach(cleanup)

describe('MasaiverseLoader', () => {
  it('renders the Masai logo and a default label inside a live status region', () => {
    render(<MasaiverseLoader />)

    // Light + dark artwork are both in the DOM; CSS (`dark:hidden`) picks one,
    // so jsdom sees the pair. Assert both are wired to the right assets.
    const logos = screen.getAllByAltText<HTMLImageElement>('Masaiverse')
    expect(logos.map((img) => img.getAttribute('src'))).toEqual([
      '/Masaiverse.svg',
      '/masaiverse-dark.svg',
    ])
    expect(logos[0].className).toContain('dark:hidden')
    expect(logos[1].className).toContain('dark:block')

    const status = screen.getByRole('status')
    expect(status.getAttribute('aria-busy')).toBe('true')
    expect(screen.getByText('Loading your community…')).toBeTruthy()
    // Default is full-height centering.
    expect(status.className).toContain('min-h-[60vh]')
  })

  it('uses a custom label and the compact (non-full-height) layout when asked', () => {
    render(<MasaiverseLoader label="Fetching events…" fullHeight={false} />)

    expect(screen.getByText('Fetching events…')).toBeTruthy()
    const status = screen.getByRole('status')
    expect(status.className).toContain('py-16')
    expect(status.className).not.toContain('min-h-[60vh]')
  })
})
