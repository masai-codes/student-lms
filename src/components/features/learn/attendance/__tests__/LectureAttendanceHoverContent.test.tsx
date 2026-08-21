// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { LectureAttendanceHoverContent } from '../LectureAttendanceHoverContent'

import type { LectureAttendanceSummary } from '@/server/attendance/types'

function makeAttendance(
  overrides: Partial<LectureAttendanceSummary> = {},
): LectureAttendanceSummary {
  return {
    overallStatus: 0,
    notApplicable: false,
    hasStudentAttendanceEntry: true,
    isCatchupWindowOver: false,
    videoPercentage: 0,
    watchPercentage: 0,
    daysRemaining: null,
    lateByMinutes: null,
    liveAttendanceStatus: 0,
    videoAttendanceStatus: 0,
    includeVideoAttendance: true,
    videoCountsForAttendance: true,
    markAbsentIfLate: false,
    isAttendanceMandatory: true,
    ...overrides,
  }
}

describe('LectureAttendanceHoverContent', () => {
  afterEach(() => cleanup())

  it.each(['absent', 'continue_watching'] as const)(
    'shows only the catch-up message for worded "%s" with days remaining',
    (uiState) => {
      render(
        <LectureAttendanceHoverContent
          attendance={makeAttendance()}
          isLiveLecture
          uiState={uiState}
          daysRemaining={3}
          iconOnly={false}
        />,
      )
      expect(
        screen.getByText('Catch up on this lecture within the next 3 days'),
      ).toBeTruthy()
      expect(screen.queryByText(/Live:/)).toBeNull()
      expect(screen.queryByText(/Video:/)).toBeNull()
    },
  )

  it('shows Live + Video lines for a present live lecture', () => {
    render(
      <LectureAttendanceHoverContent
        attendance={makeAttendance({
          overallStatus: 1,
          liveAttendanceStatus: 1,
          videoAttendanceStatus: 0,
        })}
        isLiveLecture
        uiState="present"
        daysRemaining={null}
        iconOnly={false}
      />,
    )
    expect(screen.getByText('Live: Attended')).toBeTruthy()
    expect(screen.getByText('Video: Not Watched')).toBeTruthy()
  })

  it('omits the Live line for a video lecture', () => {
    render(
      <LectureAttendanceHoverContent
        attendance={makeAttendance({
          overallStatus: 1,
          videoAttendanceStatus: 1,
        })}
        isLiveLecture={false}
        uiState="present"
        daysRemaining={null}
        iconOnly={false}
      />,
    )
    expect(screen.queryByText(/Live:/)).toBeNull()
    expect(screen.getByText('Video: Watched')).toBeTruthy()
  })

  it('adds the window-over explanation for att_window_over', () => {
    render(
      <LectureAttendanceHoverContent
        attendance={makeAttendance({ isCatchupWindowOver: true })}
        isLiveLecture
        uiState="att_window_over"
        daysRemaining={null}
        iconOnly={false}
      />,
    )
    expect(screen.getByText('Live: Not Attended')).toBeTruthy()
    expect(screen.getByText('Video: Not Watched')).toBeTruthy()
    expect(
      screen.getByText(
        'The catch up window to claim your attendance is over, hence you are marked absent',
      ),
    ).toBeTruthy()
  })

  it('shows the breakdown (not the catch-up message) for icon-only badges', () => {
    render(
      <LectureAttendanceHoverContent
        attendance={makeAttendance({ isAttendanceMandatory: false })}
        isLiveLecture
        uiState="absent"
        daysRemaining={3}
        iconOnly
      />,
    )
    expect(screen.queryByText(/Catch up on this lecture/)).toBeNull()
    expect(screen.getByText('Live: Not Attended')).toBeTruthy()
    expect(screen.getByText('Video: Not Watched')).toBeTruthy()
  })
})
