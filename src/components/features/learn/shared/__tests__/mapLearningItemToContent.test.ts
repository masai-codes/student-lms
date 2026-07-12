import { describe, expect, it, vi } from 'vitest'

vi.mock('@/utils/timeZoneHandler', () => ({
  formatScheduleRangeLocal: (start: string | null) => (start ? `local:${start}` : ''),
  formatScheduleRangeIST: (start: string | null) => (start ? `ist:${start}` : ''),
}))

import { mapLearningItemToContent } from '../mapLearningItemToContent'
import type { LearningItem } from '@/server/learn/types'

function learningItem(overrides: Partial<LearningItem> = {}): LearningItem {
  return {
    id: 1,
    learningType: 'lecture',
    title: 'Intro',
    hostName: 'Ananya',
    scheduleDate: '2026-01-01',
    concludes: '2026-01-01',
    type: 'video',
    category: 'coding',
    isOptional: 'mandatory',
    moduleName: 'Module 1',
    attendance: null,
    assignmentProgressStatus: null,
    resourcePhase: null,
    listingCtas: {
      joinLive: 'hidden',
      joinZoomLink: null,
      isNewZoomRedirection: false,
      showAttendance: false,
      assignmentStatusChip: 'completed',
      assignmentDeadlineLabel: '2 days remaining',
      assignmentScore: 7,
    },
    ...overrides,
  }
}

describe('mapLearningItemToContent', () => {
  it('maps the DTO to a card item, deriving tags and lifting CTA fields', () => {
    const result = mapLearningItemToContent(learningItem())

    expect(result).toMatchObject({
      id: 1,
      type: 'lecture',
      title: 'Intro',
      hostName: 'Ananya',
      date: 'local:2026-01-01',
      dateTooltip: 'ist:2026-01-01',
      learningSubType: 'video',
      priority: 'mandatory',
      tags: ['video', 'coding', 'Module 1'],
      assignmentStatusChip: 'completed',
      assignmentDeadlineLabel: '2 days remaining',
      assignmentScore: 7,
    })
  })

  it('nulls the date when the formatter returns empty', () => {
    const result = mapLearningItemToContent(
      learningItem({ scheduleDate: null, concludes: null }),
    )

    expect(result.date).toBeNull()
    expect(result.dateTooltip).toBeNull()
  })
})
