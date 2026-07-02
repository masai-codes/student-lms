// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { LmsSupportPanel } from './LmsSupportPanel'
import type { DashboardSupportSession } from '@/server/api/dashboard/support/getSupportSessions.service'

afterEach(cleanup)

const session = (
  over: Partial<DashboardSupportSession> = {},
): DashboardSupportSession => ({
  id: 1,
  title: 'LMS Support Session',
  schedule: '2026-07-02T18:30:00+05:30',
  concludes: '2026-07-02T19:30:00+05:30',
  zoomLink: 'https://zoom.us/j/support',
  status: 'today',
  ...over,
})

describe('LmsSupportPanel', () => {
  it('renders nothing when there is no session', () => {
    const { container } = render(<LmsSupportPanel session={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('live: blue card, live subtext, Join Now (new tab), no time pill', () => {
    render(<LmsSupportPanel session={session({ status: 'live' })} />)
    const card = screen.getByTestId('dashboard-lms-support-panel')
    expect(card.getAttribute('data-status')).toBe('live')
    expect(screen.getByText("We're live now to help you")).toBeTruthy()
    expect(screen.queryByTestId('dashboard-support-session-time')).toBeNull()
    const join = screen.getByTestId('dashboard-support-session-join')
    expect(join.getAttribute('href')).toBe('https://zoom.us/j/support')
    expect(join.getAttribute('target')).toBe('_blank')
  })

  it('scheduled today: gray card, today subtext, IST time pill, no button', () => {
    render(<LmsSupportPanel session={session({ status: 'today' })} />)
    expect(
      screen.getByText('Join our daily session to get your questions answered'),
    ).toBeTruthy()
    expect(screen.getByTestId('dashboard-support-session-time').textContent).toBe(
      '2 Jul, 6:30 PM (IST)',
    )
    expect(screen.queryByTestId('dashboard-support-session-join')).toBeNull()
  })

  it('next another day: gray card, next-session subtext, IST time pill', () => {
    render(<LmsSupportPanel session={session({ status: 'upcoming' })} />)
    expect(
      screen.getByText('No session today, the next session is scheduled for'),
    ).toBeTruthy()
    expect(screen.getByTestId('dashboard-support-session-time')).toBeTruthy()
    expect(screen.queryByTestId('dashboard-support-session-join')).toBeNull()
  })
})
