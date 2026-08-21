import { describe, expect, it } from 'vitest'

import {
  getSupportAttendancePresentation,
  getSupportCatchUpPresentation,
} from '../lectureSnapshotPresentation'
import {
  NOW_WINDOW_CLOSED,
  NOW_WINDOW_OPEN,
  absentRow,
  buildAttendanceFromSection,
  makeSnapshotFromAttendance,
  presentRow,
} from './lectureSnapshotTestHelpers'

const VIDEO_SECTION = {
  considerVideoAttendanceForActualAttendance: true,
  catchUpDays: 5,
  minimumVideoWatchPercentage: 80,
}

describe('video lecture snapshot matrix — section settings × student state', () => {
  it.each([
    {
      name: 'not watched — catch-up window open',
      nowMs: NOW_WINDOW_OPEN,
      record: absentRow(),
      watch: 0,
      label: 'Absent',
      reason:
        'You have not watched this recording yet, so you were marked absent. Watch the full recording to be marked present.',
    },
    {
      name: 'partial watch — Pending',
      nowMs: NOW_WINDOW_OPEN,
      record: absentRow(),
      watch: 40,
      label: 'Pending',
      reason:
        "You need to watch the entire recording to be marked present. You've watched 40% of the recording so far. Your status will update within 24 hours once you finish.",
    },
    {
      name: 'partial watch — catch-up window closed',
      nowMs: NOW_WINDOW_CLOSED,
      record: absentRow(),
      watch: 30,
      label: 'Absent',
      reason:
        "You did not finish watching the recording and the window to do so has closed, so you were marked absent. You've watched 30% of the recording so far.",
      catchUp: 'Closed',
    },
    {
      name: 'never watched — catch-up window closed',
      nowMs: NOW_WINDOW_CLOSED,
      record: absentRow(),
      watch: 0,
      label: 'Absent',
      reason:
        'You did not finish watching the recording and the window to do so has closed, so you were marked absent.',
      catchUp: 'Closed',
    },
    {
      name: 'threshold met — Pending waiting for 24h update',
      nowMs: NOW_WINDOW_OPEN,
      record: absentRow(),
      watch: 85,
      label: 'Pending',
      reason:
        'You have watched the full recording. Your attendance status will update within 24 hours.',
    },
  ])('$name', ({ nowMs, record, watch, label, reason, catchUp }) => {
    const attendance = buildAttendanceFromSection(
      VIDEO_SECTION,
      record,
      nowMs,
      watch,
    )
    const snapshot = makeSnapshotFromAttendance(attendance, {
      lectureKind: 'video',
      lectureDisplayType: 'video',
      livePhase: null,
      videoPhase: 'during_after',
    })

    const attendanceUi = getSupportAttendancePresentation(snapshot)
    const catchUpUi = getSupportCatchUpPresentation(snapshot)

    expect(attendanceUi.label).toBe(label)
    expect(attendanceUi.showAbsentReason).toBe(true)
    expect(attendanceUi.absentReason).toBe(reason)
    if (catchUp != null) {
      expect(catchUpUi.label).toBe(catchUp)
    } else {
      expect(catchUpUi.label).toMatch(/remaining/)
    }
  })

  it('shows Present with no reason when marked present', () => {
    const attendance = buildAttendanceFromSection(
      VIDEO_SECTION,
      presentRow(),
      NOW_WINDOW_OPEN,
    )
    const result = getSupportAttendancePresentation(
      makeSnapshotFromAttendance(attendance, {
        lectureKind: 'video',
        lectureDisplayType: 'video',
        livePhase: null,
        videoPhase: 'during_after',
      }),
    )

    expect(result).toEqual({
      label: 'Present',
      isAbsent: false,
      colorClass: 'text-[#0E9F6E] dark:text-success',
      showAbsentReason: false,
      absentReason: null,
    })
  })

  it('shows N/A before the scheduled start', () => {
    const result = getSupportAttendancePresentation(
      makeSnapshotFromAttendance(null, {
        lectureKind: 'video',
        lectureDisplayType: 'video',
        livePhase: null,
        videoPhase: 'before',
        isSessionPending: true,
        showAttendance: false,
      }),
    )

    expect(result.label).toBe('N/A')
    expect(result.showAbsentReason).toBe(false)
  })

  it('markAbsentIfLate does not affect video-lecture reason text', () => {
    const attendance = buildAttendanceFromSection(
      { ...VIDEO_SECTION, markAbsentIfLate: true },
      absentRow({ lateByMinutes: 30 }),
      NOW_WINDOW_OPEN,
      0,
    )
    const result = getSupportAttendancePresentation(
      makeSnapshotFromAttendance(attendance, {
        lectureKind: 'video',
        lectureDisplayType: 'video',
        livePhase: null,
        videoPhase: 'during_after',
      }),
    )

    expect(result.absentReason).toBe(
      'You have not watched this recording yet, so you were marked absent. Watch the full recording to be marked present.',
    )
  })
})
