// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocalTimeWithIstTooltip } from './local-time-with-ist-tooltip'
import * as tz from '@/utils/timeZoneHandler'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('LocalTimeWithIstTooltip', () => {
  it('shows the IST tooltip when the viewer timezone is not IST', () => {
    vi.spyOn(tz, 'isIstTimezone').mockReturnValue(false)
    render(
      <LocalTimeWithIstTooltip
        local="8 Jul, 12:45 PM - 2:40 PM (GMT)"
        ist="8 Jul, 5:15 PM - 7:10 PM (IST)"
      />,
    )
    expect(screen.getByText('8 Jul, 12:45 PM - 2:40 PM (GMT)')).toBeTruthy()
    expect(screen.getByRole('tooltip').textContent).toContain(
      '8 Jul, 5:15 PM - 7:10 PM (IST)',
    )
  })

  it('renders no tooltip when the viewer is already in IST', () => {
    vi.spyOn(tz, 'isIstTimezone').mockReturnValue(true)
    render(
      <LocalTimeWithIstTooltip
        local="8 Jul, 5:15 PM - 7:10 PM (IST)"
        ist="8 Jul, 5:15 PM - 7:10 PM (IST)"
      />,
    )
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('renders no tooltip when there is no IST string', () => {
    vi.spyOn(tz, 'isIstTimezone').mockReturnValue(false)
    render(<LocalTimeWithIstTooltip local="8 Jul, 12:45 PM (GMT)" ist={null} />)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('falls back when local is empty', () => {
    vi.spyOn(tz, 'isIstTimezone').mockReturnValue(false)
    render(
      <LocalTimeWithIstTooltip
        local={null}
        ist={null}
        fallback="No schedule"
      />,
    )
    expect(screen.getByText('No schedule')).toBeTruthy()
  })
})
