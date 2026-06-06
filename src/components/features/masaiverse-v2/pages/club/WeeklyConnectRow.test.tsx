// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import WeeklyConnectRow from './WeeklyConnectRow'
import type { MasaiverseV2WeeklyConnect } from '@/server/api/masaiverse-v2/services/getClubWeeklyConnects.service'

const NOW = new Date('2026-06-03T12:00:00Z')

function connect(
  overrides: Partial<MasaiverseV2WeeklyConnect> = {},
): MasaiverseV2WeeklyConnect {
  return {
    id: '1',
    title: 'Algo Study Circle',
    subtitle: 'Google Meet · 7:00 PM IST',
    startTime: '2026-06-03T11:00:00Z',
    endTime: '2026-06-03T13:00:00Z',
    ...overrides,
  }
}

afterEach(cleanup)

describe('WeeklyConnectRow', () => {
  it('shows Live Now with the IST day badge and subtitle for a running event', () => {
    render(<WeeklyConnectRow connect={connect()} now={NOW} />)
    expect(screen.getByText('Live Now')).toBeTruthy()
    expect(screen.getByText('WED')).toBeTruthy()
    expect(screen.getByText('3')).toBeTruthy()
    expect(screen.getByText('Google Meet · 7:00 PM IST')).toBeTruthy()
  })

  it('shows Upcoming for a future event', () => {
    render(
      <WeeklyConnectRow
        connect={connect({
          startTime: '2026-06-10T11:00:00Z',
          endTime: '2026-06-10T13:00:00Z',
        })}
        now={NOW}
      />,
    )
    expect(screen.getByText('Upcoming')).toBeTruthy()
  })

  it('shows Completed for an event that already ended', () => {
    render(
      <WeeklyConnectRow
        connect={connect({
          startTime: '2026-05-01T11:00:00Z',
          endTime: '2026-05-01T13:00:00Z',
        })}
        now={NOW}
      />,
    )
    expect(screen.getByText('Completed')).toBeTruthy()
  })

  it('falls back to a calendar glyph and hides subtitle when data is missing', () => {
    render(
      <WeeklyConnectRow
        connect={connect({ startTime: null, endTime: null, subtitle: null })}
        now={NOW}
      />,
    )
    expect(screen.getByText('📅')).toBeTruthy()
    expect(screen.queryByText('Google Meet · 7:00 PM IST')).toBeNull()
  })
})
