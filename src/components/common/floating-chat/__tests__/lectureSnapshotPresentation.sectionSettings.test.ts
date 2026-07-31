import { describe, expect, it } from 'vitest'

import {
  buildAttendanceFromSection,
  liveOnlyAbsentRow,
} from './lectureSnapshotTestHelpers'

describe('section settings → attendance summary fields', () => {
  it.each([
    {
      settings: {},
      videoCountsForAttendance: false,
      includeVideoAttendance: false,
      markAbsentIfLate: false,
    },
    {
      settings: { markAbsentIfLate: true },
      videoCountsForAttendance: false,
      includeVideoAttendance: false,
      markAbsentIfLate: true,
    },
    {
      settings: { enableVideoAttendance: true, catchUpDays: 5 },
      videoCountsForAttendance: false,
      includeVideoAttendance: true,
      markAbsentIfLate: false,
    },
    {
      settings: {
        considerVideoAttendanceForActualAttendance: true,
        catchUpDays: 5,
      },
      videoCountsForAttendance: true,
      includeVideoAttendance: true,
      markAbsentIfLate: false,
    },
    {
      settings: {
        enableVideoAttendance: true,
        considerVideoAttendanceForActualAttendance: true,
        catchUpDays: 3,
        markAbsentIfLate: true,
      },
      videoCountsForAttendance: true,
      includeVideoAttendance: true,
      markAbsentIfLate: true,
    },
  ])(
    'maps $settings to attendance flags',
    ({
      settings,
      videoCountsForAttendance,
      includeVideoAttendance,
      markAbsentIfLate,
    }) => {
      const summary = buildAttendanceFromSection(
        settings,
        liveOnlyAbsentRow(),
        Date.now(),
      )

      expect(summary.videoCountsForAttendance).toBe(videoCountsForAttendance)
      expect(summary.includeVideoAttendance).toBe(includeVideoAttendance)
      expect(summary.markAbsentIfLate).toBe(markAbsentIfLate)
    },
  )
})
