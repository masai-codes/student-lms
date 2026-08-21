import { describe, expect, it } from 'vitest'

import { parseSectionAttendanceSettings } from '../parseSectionAttendanceSettings'

describe('parseSectionAttendanceSettings', () => {
  it('parses JSON string settings', () => {
    expect(
      parseSectionAttendanceSettings(
        JSON.stringify({ enableVideoAttendance: true, catchUpDays: 3 }),
      ),
    ).toEqual({
      enableVideoAttendance: true,
      considerVideoAttendanceForActualAttendance: false,
      catchUpDays: 3,
      markAbsentIfLate: false,
      videoWatchThreshold: null,
    })
  })

  it('treats considerVideoAttendanceForActualAttendance as enabled video attendance', () => {
    expect(
      parseSectionAttendanceSettings({
        considerVideoAttendanceForActualAttendance: true,
        catchUpDays: 5,
      }),
    ).toEqual({
      enableVideoAttendance: true,
      considerVideoAttendanceForActualAttendance: true,
      catchUpDays: 5,
      markAbsentIfLate: false,
      videoWatchThreshold: null,
    })
  })

  it('tracks video attendance without counting it toward actual attendance', () => {
    // enableVideoAttendance (catch-up) on, but NOT considered for actual status:
    // the two flags are independent.
    expect(
      parseSectionAttendanceSettings({
        enableVideoAttendance: true,
        considerVideoAttendanceForActualAttendance: false,
        catchUpDays: 4,
      }),
    ).toEqual({
      enableVideoAttendance: true,
      considerVideoAttendanceForActualAttendance: false,
      catchUpDays: 4,
      markAbsentIfLate: false,
      videoWatchThreshold: null,
    })
  })

  it('reads markAbsentIfLate from settings', () => {
    expect(parseSectionAttendanceSettings({ markAbsentIfLate: true })).toEqual({
      enableVideoAttendance: false,
      considerVideoAttendanceForActualAttendance: false,
      catchUpDays: 0,
      markAbsentIfLate: true,
      videoWatchThreshold: null,
    })
  })

  it('reads minimumVideoWatchPercentage as videoWatchThreshold', () => {
    expect(
      parseSectionAttendanceSettings({ minimumVideoWatchPercentage: 75 }),
    ).toEqual({
      enableVideoAttendance: false,
      considerVideoAttendanceForActualAttendance: false,
      catchUpDays: 0,
      markAbsentIfLate: false,
      videoWatchThreshold: 75,
    })
  })

  it('returns null threshold for zero or non-numeric minimumVideoWatchPercentage', () => {
    expect(
      parseSectionAttendanceSettings({ minimumVideoWatchPercentage: 0 }),
    ).toMatchObject({ videoWatchThreshold: null })
    expect(
      parseSectionAttendanceSettings({ minimumVideoWatchPercentage: 'bad' }),
    ).toMatchObject({ videoWatchThreshold: null })
  })

  it('returns safe defaults for invalid input', () => {
    expect(parseSectionAttendanceSettings('not-json')).toEqual({
      enableVideoAttendance: false,
      considerVideoAttendanceForActualAttendance: false,
      catchUpDays: 0,
      markAbsentIfLate: false,
      videoWatchThreshold: null,
    })
  })
})
