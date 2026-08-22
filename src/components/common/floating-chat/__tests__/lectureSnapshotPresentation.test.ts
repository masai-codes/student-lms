import { describe, expect, it } from 'vitest'

import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type { LectureSupportSnapshot } from '@/server/api/support/support.types'
import {
  formatAiSummaryStatusLabel,
  formatRecordingStatusLabel,
  getSupportAttendancePresentation,
  getSupportCatchUpPresentation,
  shouldShowUnableToJoinLiveLecture,
} from '../lectureSnapshotPresentation'

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
    daysRemaining: 2,
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

function makeSnapshot(
  overrides: Partial<LectureSupportSnapshot> = {},
): LectureSupportSnapshot {
  return {
    lectureId: 1,
    batchId: 42,
    title: 'Intro to JS',
    meta: 'module-1',
    date: '24 Jul, 01:00 pm',
    lectureDisplayType: 'live',
    lectureKind: 'live',
    schedule: '2026-07-21 18:00:00',
    isOptional: false,
    isMandatory: true,
    livePhase: 'after',
    videoPhase: null,
    joinLiveButtonState: null,
    isSessionPending: false,
    recordingStatus: 'available',
    recordingUrl: 'https://example.com/video',
    aiSummaryStatus: 'generated',
    attendance: makeAttendance(),
    showAttendance: true,
    ...overrides,
  }
}

describe('getSupportAttendancePresentation', () => {
  it('shows Present for optional live lectures when attendance is marked present', () => {
    const result = getSupportAttendancePresentation(
      makeSnapshot({
        isMandatory: false,
        attendance: makeAttendance({ overallStatus: 1 }),
      }),
    )

    expect(result.label).toBe('Present')
    expect(result.showAbsentReason).toBe(false)
  })

  it('shows Absent with reason for optional live lectures when the student missed the session', () => {
    const result = getSupportAttendancePresentation(
      makeSnapshot({
        isMandatory: false,
        attendance: makeAttendance({ videoCountsForAttendance: false }),
      }),
    )

    expect(result.label).toBe('Absent')
    expect(result.absentReason).toMatch(/did not join the live session/i)
  })

  it('shows Absent with video-specific reason for optional video lectures', () => {
    const result = getSupportAttendancePresentation(
      makeSnapshot({
        lectureKind: 'video',
        isMandatory: false,
        attendance: makeAttendance({ watchPercentage: 0, videoPercentage: 0 }),
      }),
    )

    expect(result.label).toBe('Absent')
    expect(result.absentReason).toMatch(/have not watched this recording yet/i)
  })

  it('shows plain N/A with no reason when a mandatory session has not ended yet', () => {
    const result = getSupportAttendancePresentation(
      makeSnapshot({ showAttendance: false, attendance: null }),
    )

    expect(result.label).toBe('N/A')
    expect(result.showAbsentReason).toBe(false)
    expect(result.absentReason).toBeNull()
  })

  it('shows Present with no reason when attendance is marked present', () => {
    const result = getSupportAttendancePresentation(
      makeSnapshot({ attendance: makeAttendance({ overallStatus: 1 }) }),
    )

    expect(result.label).toBe('Present')
    expect(result.showAbsentReason).toBe(false)
  })

  it('explains a missed live session when video does not count for attendance', () => {
    const result = getSupportAttendancePresentation(
      makeSnapshot({
        attendance: makeAttendance({ videoCountsForAttendance: false }),
      }),
    )

    expect(result.label).toBe('Absent')
    expect(result.absentReason).toMatch(/did not join the live session/i)
    expect(result.absentReason).toMatch(
      /only live class attendance is counted/i,
    )
  })

  it('tells the student they can still catch up via the recording', () => {
    const result = getSupportAttendancePresentation(
      makeSnapshot({
        attendance: makeAttendance({ videoCountsForAttendance: true }),
      }),
    )

    expect(result.absentReason).toMatch(/catch-up window/i)
  })

  it('says the catch-up window has closed once it is over', () => {
    const result = getSupportAttendancePresentation(
      makeSnapshot({
        attendance: makeAttendance({
          videoCountsForAttendance: true,
          isCatchupWindowOver: true,
          daysRemaining: 0,
        }),
      }),
    )

    expect(result.absentReason).toMatch(
      /window to watch the recording.*closed/i,
    )
  })

  it('marks a late join absent when the section enforces the late limit', () => {
    const result = getSupportAttendancePresentation(
      makeSnapshot({
        attendance: makeAttendance({
          lateByMinutes: 15,
          markAbsentIfLate: true,
        }),
      }),
    )

    expect(result.absentReason).toMatch(
      /late by 15 min, past the allowed limit/i,
    )
  })

  it('explains a late join is not fatal when the section does not enforce it', () => {
    const result = getSupportAttendancePresentation(
      makeSnapshot({
        attendance: makeAttendance({
          lateByMinutes: 15,
          markAbsentIfLate: false,
        }),
      }),
    )

    expect(result.absentReason).toMatch(/that alone doesn't mark you absent/i)
    expect(result.absentReason).toMatch(/24 hours/i)
  })

  it('explains video-lecture attendance from watch percentage', () => {
    const result = getSupportAttendancePresentation(
      makeSnapshot({
        lectureKind: 'video',
        attendance: makeAttendance({ watchPercentage: 40 }),
      }),
    )

    expect(result.absentReason).toMatch(
      /finish watching the recording to be marked present/i,
    )
  })

  it('explains a video lecture with no watch progress at all', () => {
    const result = getSupportAttendancePresentation(
      makeSnapshot({
        lectureKind: 'video',
        attendance: makeAttendance({ watchPercentage: 0, videoPercentage: 0 }),
      }),
    )

    expect(result.absentReason).toMatch(/have not watched this recording yet/i)
  })

  it('explains a video lecture once its catch-up window has closed', () => {
    const result = getSupportAttendancePresentation(
      makeSnapshot({
        lectureKind: 'video',
        attendance: makeAttendance({
          watchPercentage: 30,
          isCatchupWindowOver: true,
          daysRemaining: 0,
        }),
      }),
    )

    expect(result.absentReason).toMatch(
      /did not finish watching the recording/i,
    )
    expect(result.absentReason).toMatch(/window to finish it has closed/i)
  })
})

describe('getSupportCatchUpPresentation', () => {
  it('shows the same countdown label as the lecture detail header', () => {
    const result = getSupportCatchUpPresentation(
      makeSnapshot({
        attendance: makeAttendance({
          daysRemaining: 2,
        }),
      }),
    )

    expect(result.label).toBe('2 days remaining')
  })

  it('shows Closed when the catch-up window is over', () => {
    const result = getSupportCatchUpPresentation(
      makeSnapshot({
        attendance: makeAttendance({
          videoCountsForAttendance: true,
          isCatchupWindowOver: true,
          daysRemaining: 0,
        }),
      }),
    )

    expect(result.label).toBe('Closed')
  })

  it('shows N/A when attendance is not scored for the session', () => {
    const result = getSupportCatchUpPresentation(
      makeSnapshot({ showAttendance: false, attendance: null }),
    )

    expect(result.label).toBe('N/A')
  })

  it('shows N/A when the student is present', () => {
    const result = getSupportCatchUpPresentation(
      makeSnapshot({
        attendance: makeAttendance({ overallStatus: 1 }),
      }),
    )

    expect(result.label).toBe('N/A')
  })

  it('shows N/A when only live attendance counts', () => {
    const result = getSupportCatchUpPresentation(
      makeSnapshot({
        attendance: makeAttendance({
          videoCountsForAttendance: false,
          daysRemaining: null,
        }),
      }),
    )

    expect(result.label).toBe('N/A')
  })

  it('shows em dash when video counts but no remaining label is available', () => {
    const result = getSupportCatchUpPresentation(
      makeSnapshot({
        attendance: makeAttendance({
          videoCountsForAttendance: true,
          daysRemaining: null,
          isCatchupWindowOver: false,
        }),
      }),
    )

    expect(result.label).toBe('—')
  })
})

describe('formatRecordingStatusLabel', () => {
  it.each([
    ['available', 'Available'],
    ['not_available', 'Not available'],
  ] as const)('maps %s to %s', (status, label) => {
    expect(formatRecordingStatusLabel(status)).toBe(label)
  })
})

describe('formatAiSummaryStatusLabel', () => {
  it.each([
    ['generated', 'Generated'],
    ['processing', 'Processing'],
    ['not_available', 'Not available'],
  ] as const)('maps %s to %s', (status, label) => {
    expect(formatAiSummaryStatusLabel(status)).toBe(label)
  })
})

describe('shouldShowUnableToJoinLiveLecture', () => {
  it('is true only for live lectures during the session', () => {
    expect(
      shouldShowUnableToJoinLiveLecture(
        makeSnapshot({ lectureKind: 'live', livePhase: 'during' }),
      ),
    ).toBe(true)
    expect(
      shouldShowUnableToJoinLiveLecture(
        makeSnapshot({ lectureKind: 'live', livePhase: 'after' }),
      ),
    ).toBe(false)
    expect(
      shouldShowUnableToJoinLiveLecture(
        makeSnapshot({
          lectureKind: 'video',
          livePhase: null,
          videoPhase: 'during_after',
        }),
      ),
    ).toBe(false)
  })
})
