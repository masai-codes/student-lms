import { describe, expect, it } from 'vitest'

import type { LearningItem } from '@/server/learn/types'
import type { LearningEntityRow } from '@/server/learn/utils/learningDataMappers'
import { applyLearnListingFilters } from '@/server/learn/utils/applyLearnListingFilters'

function lectureItem(
  overrides: Partial<LearningItem> & { id: number },
): LearningItem {
  return {
    id: overrides.id,
    learningType: 'lecture',
    title: overrides.title ?? 'Lecture',
    hostName: overrides.hostName ?? 'Host',
    scheduleDate: overrides.scheduleDate ?? '2026-05-10 10:00:00',
    type: overrides.type ?? 'live',
    category: overrides.category ?? 'coding',
    isOptional: overrides.isOptional ?? 'mandatory',
    moduleName: overrides.moduleName ?? 'Module 1',
    attendance: overrides.attendance ?? {
      overallStatus: 1,
      notApplicable: false,
      hasStudentAttendanceEntry: true,
      isCatchupWindowOver: false,
      videoPercentage: 0,
      daysRemaining: null,
      lateByMinutes: null,
    },
    assignmentProgressStatus: null,
    resourcePhase: null,
    listingCtas: {
      joinLive: 'hidden',
      showAttendance: true,
      assignmentStatusChip: null,
    },
  }
}

describe('applyLearnListingFilters', () => {
  const nowMs = new Date('2026-05-11T00:00:00.000Z').getTime()

  it('filters by attendance and schedule phase', () => {
    const items = [
      lectureItem({ id: 1, attendance: { ...lectureItem({ id: 1 }).attendance!, overallStatus: 1 } }),
      lectureItem({
        id: 2,
        attendance: { ...lectureItem({ id: 2 }).attendance!, overallStatus: 0 },
      }),
    ]

    const rows = new Map<number, LearningEntityRow>([
      [
        1,
        {
          id: 1,
          title: 'A',
          category: 'coding',
          type: 'live',
          optional: 0,
          schedule: '2026-05-12 10:00:00',
          concludes: '2026-05-12 12:00:00',
          week: 1,
          module: null,
          hostName: 'Host',
        },
      ],
      [
        2,
        {
          id: 2,
          title: 'B',
          category: 'coding',
          type: 'live',
          optional: 0,
          schedule: '2026-05-01 10:00:00',
          concludes: '2026-05-01 12:00:00',
          week: 1,
          module: null,
          hostName: 'Host',
        },
      ],
    ])

    const presentOnly = applyLearnListingFilters(items, rows, {
      attendanceStatus: 'present',
    }, nowMs)
    expect(presentOnly.map((item) => item.id)).toEqual([1])

    const upcomingOnly = applyLearnListingFilters(items, rows, {
      schedulePhase: 'upcoming',
    }, nowMs)
    expect(upcomingOnly.map((item) => item.id)).toEqual([1])
  })
})
