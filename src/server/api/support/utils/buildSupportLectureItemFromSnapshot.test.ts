import { describe, expect, it } from 'vitest'

import type { LectureSupportSnapshot } from '@/server/api/support/support.types'
import { buildSupportLectureItemFromSnapshot } from '@/server/api/support/utils/buildSupportLectureItemFromSnapshot'

function makeSnapshot(
  overrides: Partial<LectureSupportSnapshot> = {},
): LectureSupportSnapshot {
  return {
    lectureId: 42,
    batchId: 10,
    lectureKind: 'live',
    title: 'Intro to JS',
    meta: 'Module 1',
    date: 'Today',
    lectureDisplayType: 'scrum',
    schedule: '2026-07-21 18:00:00',
    isMandatory: true,
    isOptional: false,
    livePhase: null,
    videoPhase: null,
    joinLiveButtonState: null,
    isSessionPending: false,
    recordingStatus: 'not_available',
    recordingUrl: null,
    aiSummaryStatus: 'not_available',
    attendance: null,
    showAttendance: false,
    ...overrides,
  }
}

describe('buildSupportLectureItemFromSnapshot', () => {
  it('maps snapshot display fields onto a support item card', () => {
    expect(buildSupportLectureItemFromSnapshot(makeSnapshot())).toEqual({
      id: 42,
      title: 'Intro to JS',
      meta: 'Module 1',
      date: 'Today',
      type: 'scrum',
      startTime: '2026-07-21 18:00:00',
      isMandatory: true,
    })
  })
})
