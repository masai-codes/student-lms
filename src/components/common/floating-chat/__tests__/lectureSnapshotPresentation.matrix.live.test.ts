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
  liveOnlyAbsentRow,
  makeSnapshotFromAttendance,
  presentRow,
} from './lectureSnapshotTestHelpers'

const LIVE_ONLY_SECTION = {}
const VIDEO_COUNTS_SECTION = {
  considerVideoAttendanceForActualAttendance: true,
  catchUpDays: 5,
}
const VIDEO_TRACKED_ONLY_SECTION = {
  enableVideoAttendance: true,
  catchUpDays: 5,
}

describe('live lecture snapshot matrix — section settings × student state', () => {
  describe('live-only attendance (video does not count)', () => {
    it.each([
      {
        name: 'absent — no late join',
        record: liveOnlyAbsentRow(),
        watch: 0,
        label: 'Absent',
        reason:
          'You did not join the live session, so you were marked absent. Only live class attendance is counted for this session; watching the recording will not change your status.',
        catchUp: 'N/A',
      },
      {
        name: 'late join — markAbsentIfLate enforced',
        record: liveOnlyAbsentRow({ lateByMinutes: 15 }),
        watch: 0,
        section: { markAbsentIfLate: true },
        label: 'Absent',
        reason:
          'You joined the live session late by 15 min, past the allowed limit, so you were marked absent. Only live class attendance is counted for this session; watching the recording will not change your status.',
        catchUp: 'N/A',
      },
      {
        name: 'late join — markAbsentIfLate not enforced',
        record: liveOnlyAbsentRow({ lateByMinutes: 15 }),
        watch: 0,
        section: { markAbsentIfLate: false },
        label: 'Absent',
        reason:
          "You joined the live session late by 15 min — that alone doesn't mark you absent; your status will update within 24 hours. Only live class attendance is counted for this session; watching the recording will not change your status.",
        catchUp: 'N/A',
      },
    ])('$name', ({ record, watch, section, label, reason, catchUp }) => {
      const attendance = buildAttendanceFromSection(
        { ...LIVE_ONLY_SECTION, ...section },
        record,
        NOW_WINDOW_OPEN,
        watch,
      )
      const snapshot = makeSnapshotFromAttendance(attendance)

      const attendanceUi = getSupportAttendancePresentation(snapshot)
      const catchUpUi = getSupportCatchUpPresentation(snapshot)

      expect(attendanceUi.label).toBe(label)
      expect(attendanceUi.showAbsentReason).toBe(true)
      expect(attendanceUi.absentReason).toBe(reason)
      expect(catchUpUi.label).toBe(catchUp)
    })

    it('shows Present with no reason when marked present', () => {
      const attendance = buildAttendanceFromSection(
        LIVE_ONLY_SECTION,
        presentRow(),
        NOW_WINDOW_OPEN,
      )
      const result = getSupportAttendancePresentation(
        makeSnapshotFromAttendance(attendance),
      )

      expect(result).toEqual({
        label: 'Present',
        colorClass: 'text-[#0E9F6E]',
        showAbsentReason: false,
        absentReason: null,
      })
    })
  })

  describe('video counts toward attendance (considerVideoAttendanceForActualAttendance)', () => {
    it.each([
      {
        name: 'absent — catch-up window open',
        nowMs: NOW_WINDOW_OPEN,
        record: absentRow(),
        watch: 0,
        label: 'Absent',
        reason:
          'You did not join the live session, so you were marked absent. You can still watch the recording to become Present within the catch-up window.',
      },
      {
        name: 'absent — catch-up window closed',
        nowMs: NOW_WINDOW_CLOSED,
        record: absentRow(),
        watch: 0,
        label: 'Absent',
        reason:
          'You did not join the live session, so you were marked absent. The window to watch the recording and claim attendance has closed.',
        catchUp: 'Closed',
      },
      {
        name: 'partial watch — Pending with continue-watching reason',
        nowMs: NOW_WINDOW_OPEN,
        record: absentRow(),
        watch: 40,
        label: 'Pending',
        reason:
          'You did not join the live session, so you were marked absent. Finish watching the recording to become Present; status updates can take up to 24 hours.',
      },
      {
        name: 'late join enforced — catch-up window open',
        nowMs: NOW_WINDOW_OPEN,
        record: absentRow({ lateByMinutes: 15 }),
        watch: 0,
        section: { markAbsentIfLate: true },
        label: 'Absent',
        reason:
          'You joined the live session late by 15 min, past the allowed limit, so you were marked absent. You can still watch the recording to become Present within the catch-up window.',
      },
      {
        name: 'late join not enforced — catch-up window open',
        nowMs: NOW_WINDOW_OPEN,
        record: absentRow({ lateByMinutes: 15 }),
        watch: 0,
        section: { markAbsentIfLate: false },
        label: 'Absent',
        reason:
          "You joined the live session late by 15 min — that alone doesn't mark you absent; your status will update within 24 hours. You can still watch the recording to become Present within the catch-up window.",
      },
      {
        name: 'late join enforced — partial watch',
        nowMs: NOW_WINDOW_OPEN,
        record: absentRow({ lateByMinutes: 20 }),
        watch: 55,
        section: { markAbsentIfLate: true },
        label: 'Pending',
        reason:
          'You joined the live session late by 20 min, past the allowed limit, so you were marked absent. Finish watching the recording to become Present; status updates can take up to 24 hours.',
      },
    ])('$name', ({ nowMs, record, watch, section, label, reason }) => {
      const attendance = buildAttendanceFromSection(
        { ...VIDEO_COUNTS_SECTION, ...section },
        record,
        nowMs,
        watch,
      )
      const attendanceUi = getSupportAttendancePresentation(
        makeSnapshotFromAttendance(attendance),
      )

      expect(attendanceUi.label).toBe(label)
      expect(attendanceUi.showAbsentReason).toBe(true)
      expect(attendanceUi.absentReason).toBe(reason)
    })

    it('shows catch-up countdown while the window is open', () => {
      const attendance = buildAttendanceFromSection(
        VIDEO_COUNTS_SECTION,
        absentRow(),
        NOW_WINDOW_OPEN,
      )
      const catchUpUi = getSupportCatchUpPresentation(
        makeSnapshotFromAttendance(attendance),
      )

      expect(catchUpUi.label).toMatch(/remaining/)
    })
  })

  describe('video tracked but does not count (enableVideoAttendance only)', () => {
    it('uses live-only reason and hides catch-up when video does not count', () => {
      const attendance = buildAttendanceFromSection(
        VIDEO_TRACKED_ONLY_SECTION,
        liveOnlyAbsentRow(),
        NOW_WINDOW_OPEN,
      )
      const attendanceUi = getSupportAttendancePresentation(
        makeSnapshotFromAttendance(attendance),
      )
      const catchUpUi = getSupportCatchUpPresentation(
        makeSnapshotFromAttendance(attendance),
      )

      expect(attendanceUi.absentReason).toBe(
        'You did not join the live session, so you were marked absent. Only live class attendance is counted for this session; watching the recording will not change your status.',
      )
      expect(catchUpUi.label).toBe('N/A')
    })
  })

  describe('session not ended', () => {
    it('shows N/A attendance with no reason before the session ends', () => {
      const result = getSupportAttendancePresentation(
        makeSnapshotFromAttendance(null, {
          showAttendance: false,
          livePhase: 'during',
          isSessionPending: true,
        }),
      )

      expect(result).toEqual({
        label: 'N/A',
        colorClass: 'text-[#62647d]',
        showAbsentReason: false,
        absentReason: null,
      })
    })
  })

  describe('missing attendance row after session ended', () => {
    it('shows Pending with no reason when attendance data is unavailable', () => {
      const result = getSupportAttendancePresentation(
        makeSnapshotFromAttendance(null),
      )

      expect(result.label).toBe('Pending')
      expect(result.showAbsentReason).toBe(false)
      expect(result.absentReason).toBeNull()
    })
  })
})
