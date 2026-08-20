// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LectureAttendanceInline } from '../LectureAttendanceInline'

// IIT Jodhpur portal hides the catch-up countdown (see
// `CATCH_UP_COUNTDOWN_PORTALS` in `@/utils/portalCapabilities`).
vi.mock('@/utils/portal', () => ({
  showsCatchUpCountdown: () => false,
}))

describe('lecture attendance catch-up countdown', () => {
  afterEach(() => cleanup())

  it('hides the days-remaining label on portals without the countdown', () => {
    render(
      <LectureAttendanceInline
        uiState="absent"
        daysRemaining={4}
        showBadge
        iconOnly={false}
      />,
    )
    expect(screen.queryByText('4 days remaining')).toBeNull()
    expect(screen.getByText('Absent')).toBeTruthy()
  })
})
