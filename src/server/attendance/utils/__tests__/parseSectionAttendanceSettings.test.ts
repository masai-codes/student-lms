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
    })
  })

  it('returns safe defaults for invalid input', () => {
    expect(parseSectionAttendanceSettings('not-json')).toEqual({
      enableVideoAttendance: false,
      considerVideoAttendanceForActualAttendance: false,
      catchUpDays: 0,
    })
  })
})
