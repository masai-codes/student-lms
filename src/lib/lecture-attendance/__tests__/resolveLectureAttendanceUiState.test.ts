import { describe, expect, it } from 'vitest'

import { resolveLectureAttendanceUiState } from '../resolveLectureAttendanceUiState'

describe('resolveLectureAttendanceUiState', () => {
  it('returns present when overall status is 1', () => {
    expect(resolveLectureAttendanceUiState({ overallStatus: 1 })).toBe(
      'present',
    )
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

  it('keeps att_window_over after the video-watch backfill row is created', () => {
    // First watch inserts a placeholder `student_attendances` row with
    // `meta.notApplicable = true`; the window-over badge must survive it.
    expect(
      resolveLectureAttendanceUiState({
        overallStatus: 0,
        isCatchupWindowOver: true,
        notApplicable: true,
        hasStudentAttendanceEntry: true,
        localWatchPercentage: 65,
        daysRemaining: 0,
      }),
    ).toBe('att_window_over')
  })

  it('keeps att_window_over once the recording is fully watched', () => {
    expect(
      resolveLectureAttendanceUiState({
        overallStatus: 0,
        isCatchupWindowOver: true,
        notApplicable: false,
        hasStudentAttendanceEntry: true,
        localWatchPercentage: 100,
        daysRemaining: 0,
      }),
    ).toBe('att_window_over')
  })

  it('keeps absent when the placeholder row lands inside an open window', () => {
    expect(
      resolveLectureAttendanceUiState({
        overallStatus: 0,
        isCatchupWindowOver: false,
        notApplicable: true,
        hasStudentAttendanceEntry: true,
        localWatchPercentage: 100,
        daysRemaining: 2,
      }),
    ).toBe('absent')
  })

  it('still hides lectures whose attendance is genuinely not applicable', () => {
    expect(
      resolveLectureAttendanceUiState({
        overallStatus: 0,
        isCatchupWindowOver: null,
        notApplicable: true,
        hasStudentAttendanceEntry: true,
        daysRemaining: null,
      }),
    ).toBe('hidden')
  })

  it('returns null when status is unknown', () => {
    expect(resolveLectureAttendanceUiState({ overallStatus: null })).toBeNull()
  })
})
