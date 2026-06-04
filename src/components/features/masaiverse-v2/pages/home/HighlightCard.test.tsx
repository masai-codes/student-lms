// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import HighlightCard from './HighlightCard'
import type { MasaiverseV2HomeHighlight } from '@/server/api/masaiverse-v2/services/getHomeHighlights.service'

function makeHighlight(
  overrides: Partial<MasaiverseV2HomeHighlight> = {},
): MasaiverseV2HomeHighlight {
  return {
    id: '11',
    aboveTitle: 'WEEKLY HACKATHON · RESULTS',
    title: 'Build Sprint #11 — Winners',
    belowTitle: '43 submissions',
    pastEventEmojiValue: '⚡',
    startTime: '2026-05-28T09:00:00Z',
    ...overrides,
  }
}

afterEach(cleanup)

describe('HighlightCard', () => {
  it('renders the emoji and three text lines', () => {
    render(<HighlightCard highlight={makeHighlight()} />)

    expect(screen.getByText('⚡')).toBeTruthy()
    expect(screen.getByText('WEEKLY HACKATHON · RESULTS')).toBeTruthy()
    expect(screen.getByText('Build Sprint #11 — Winners')).toBeTruthy()
    expect(screen.getByText('43 submissions')).toBeTruthy()
    // Start date + time, formatted in IST (14:30 IST == 09:00 UTC).
    expect(screen.getByText('May 28 · 2:30 PM')).toBeTruthy()
  })

  it('applies the accent color as a left-edge border', () => {
    const { container } = render(
      <HighlightCard highlight={makeHighlight()} accentColor="#2563EB" />,
    )
    const { borderLeftColor, borderLeftWidth, borderLeftStyle } = (
      container.firstChild as HTMLElement
    ).style
    // jsdom normalizes the hex (#2563EB) to rgb.
    expect(borderLeftColor).toBe('rgb(37, 99, 235)')
    expect(borderLeftWidth).toBe('4px')
    expect(borderLeftStyle).toBe('solid')
  })

  it('omits the emoji, optional lines, and date when absent', () => {
    render(
      <HighlightCard
        highlight={makeHighlight({
          aboveTitle: null,
          belowTitle: null,
          pastEventEmojiValue: null,
          startTime: null,
        })}
      />,
    )

    expect(screen.queryByText('⚡')).toBeNull()
    expect(screen.queryByText('WEEKLY HACKATHON · RESULTS')).toBeNull()
    expect(screen.queryByText(/·/)).toBeNull()
    expect(screen.getByText('Build Sprint #11 — Winners')).toBeTruthy()
  })
})
