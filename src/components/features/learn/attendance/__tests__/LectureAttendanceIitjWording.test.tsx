// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LectureAttendanceInline } from '../LectureAttendanceInline'
import { LectureAttendanceStatusBadge } from '../LectureAttendanceStatusBadge'

// IIT Jodhpur portal: attendance reads as watch progress and the catch-up
// countdown is hidden (see `WATCHED_ATTENDANCE_WORDING_PORTALS` /
// `CATCH_UP_COUNTDOWN_PORTALS` in `@/utils/portalCapabilities`).
vi.mock('@/utils/portal', () => ({
  usesWatchedAttendanceWording: () => true,
  showsCatchUpCountdown: () => false,
}))

describe('lecture attendance on the IIT Jodhpur portal', () => {
  afterEach(() => cleanup())

  it.each([
    ['present', 'Watched'],
    ['absent', 'Not Watched'],
    ['att_window_over', 'Not Watched'],
  ] as const)('words the "%s" badge as "%s"', (state, label) => {
    render(<LectureAttendanceStatusBadge state={state} />)
    expect(screen.getByText(label)).toBeTruthy()
  })

  it('keeps the Continue Watching badge unchanged', () => {
    render(<LectureAttendanceStatusBadge state="continue_watching" />)
    expect(screen.getByText('Continue Watching')).toBeTruthy()
  })

  it('hides the catch-up days-remaining label', () => {
    render(
      <LectureAttendanceInline uiState="absent" daysRemaining={4} showBadge />,
    )
    expect(screen.queryByText('4 days remaining')).toBeNull()
    expect(screen.getByText('Not Watched')).toBeTruthy()
  })
})
