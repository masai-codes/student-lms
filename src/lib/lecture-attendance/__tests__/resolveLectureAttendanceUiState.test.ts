import { describe, expect, it } from 'vitest'

import { resolveLectureAttendanceUiState } from '../resolveLectureAttendanceUiState'

describe('resolveLectureAttendanceUiState', () => {
  it('returns present when overall status is 1', () => {
    expect(resolveLectureAttendanceUiState({ overallStatus: 1 })).toBe('present')
  })

  it('returns continue_watching when partial video progress remains', () => {
    expect(
      resolveLectureAttendanceUiState({
        overallStatus: 0,
        localWatchPercentage: 40,
        daysRemaining: 2,
        notApplicable: false,
        hasStudentAttendanceEntry: true,
      }),
    ).toBe('continue_watching')
  })

  it('returns att_window_over when catch-up ended', () => {
    expect(
      resolveLectureAttendanceUiState({
        overallStatus: 0,
        isCatchupWindowOver: true,
        notApplicable: false,
        hasStudentAttendanceEntry: true,
      }),
    ).toBe('att_window_over')
  })

  it('returns null when status is unknown', () => {
    expect(resolveLectureAttendanceUiState({ overallStatus: null })).toBeNull()
  })
})
