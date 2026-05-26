import { describe, expect, it } from 'vitest'

import { parseSectionAttendanceSettings } from '../parseSectionAttendanceSettings'

describe('parseSectionAttendanceSettings', () => {
  it('parses JSON string settings', () => {
    expect(
      parseSectionAttendanceSettings(
        JSON.stringify({ enableVideoAttendance: true, catchUpDays: 3 }),
      ),
    ).toEqual({ enableVideoAttendance: true, catchUpDays: 3 })
  })

  it('treats considerVideoAttendanceForActualAttendance as enabled video attendance', () => {
    expect(
      parseSectionAttendanceSettings({
        considerVideoAttendanceForActualAttendance: true,
        catchUpDays: 5,
      }),
    ).toEqual({ enableVideoAttendance: true, catchUpDays: 5 })
  })

  it('returns safe defaults for invalid input', () => {
    expect(parseSectionAttendanceSettings('not-json')).toEqual({
      enableVideoAttendance: false,
      catchUpDays: 0,
    })
  })
})
