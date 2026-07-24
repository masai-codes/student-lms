import { describe, expect, it } from 'vitest'

import {
  mapLearningItemToSupportItem,
  supportCategoryToLearnFilters,
} from '@/components/common/floating-chat/supportCategoryLearning'
import type { LearningItem } from '@/server/learn/types'

function buildLearningItem(overrides: Partial<LearningItem> = {}): LearningItem {
  return {
    id: 1,
    learningType: 'assignment',
    title: 'Sample assignment',
    hostName: 'Host',
    scheduleDate: '2026-07-21 18:00:00',
    concludes: null,
    type: 'assignment',
    category: 'coding',
    isOptional: 'mandatory',
    moduleName: 'module-1',
    assignmentProgressStatus: 'new',
    resourcePhase: null,
    attendance: null,
    optionalAttendance: null,
    listingCtas: {
      joinLive: 'hidden',
      joinZoomLink: null,
      isNewZoomRedirection: false,
      enableZoomWebView: false,
      showAttendance: false,
      assignmentStatusChip: 'new',
      assignmentDeadlineLabel: null,
      assignmentScore: null,
    },
    ...overrides,
  }
}

describe('mapLearningItemToSupportItem', () => {
  it('includes moduleName for assignment and evaluation cards', () => {
    expect(mapLearningItemToSupportItem(buildLearningItem())).toMatchObject({
      meta: 'coding',
      moduleName: 'module-1',
      isMandatory: true,
      isOptional: false,
    })

    expect(
      mapLearningItemToSupportItem(
        buildLearningItem({ type: 'evaluation', category: 'dsa', isOptional: 'recommended' }),
      ),
    ).toMatchObject({
      meta: 'dsa',
      moduleName: 'module-1',
      isOptional: true,
      isMandatory: false,
    })
  })

  it('keeps module in meta for lectures only', () => {
    expect(
      mapLearningItemToSupportItem(
        buildLearningItem({
          learningType: 'lecture',
          type: 'live',
          category: 'coding',
          moduleName: 'module-5',
        }),
      ),
    ).toMatchObject({
      meta: 'module-5',
      moduleName: undefined,
    })
  })

  it('maps lecture optional and mandatory priority chips', () => {
    expect(
      mapLearningItemToSupportItem(
        buildLearningItem({
          learningType: 'lecture',
          type: 'live',
          isOptional: 'recommended',
          moduleName: 'module-2',
        }),
      ),
    ).toMatchObject({
      isOptional: true,
      isMandatory: false,
    })

    expect(
      mapLearningItemToSupportItem(
        buildLearningItem({
          learningType: 'lecture',
          type: 'video',
          isOptional: 'mandatory',
          moduleName: 'module-3',
        }),
      ),
    ).toMatchObject({
      isOptional: false,
      isMandatory: true,
    })
  })

  it('maps scrum lectures to support item type and label', () => {
    expect(
      mapLearningItemToSupportItem(
        buildLearningItem({
          learningType: 'lecture',
          type: 'scrum',
          moduleName: 'module-1',
        }),
      ),
    ).toMatchObject({
      type: 'scrum',
      meta: 'module-1',
    })
  })
})

describe('supportCategoryToLearnFilters', () => {
  it('scopes assignments to assignment and practice types', () => {
    expect(supportCategoryToLearnFilters('assignment')).toEqual({
      types: ['assignment', 'practice'],
    })
  })

  it('maps assignment optional/mandatory, category, and module filters', () => {
    expect(
      supportCategoryToLearnFilters('assignment', {
        assignmentPriority: 'recommended',
        assignmentCategory: 'coding',
        assignmentModule: 'Module 1',
      }),
    ).toEqual({
      types: ['assignment', 'practice'],
      priorities: ['recommended'],
      categories: ['coding'],
      modules: ['Module 1'],
    })
  })

  it('scopes evaluations to evaluation type only', () => {
    expect(supportCategoryToLearnFilters('evaluation')).toEqual({
      types: ['evaluation'],
    })
  })

  it('maps evaluation progress status and module filters', () => {
    expect(
      supportCategoryToLearnFilters('evaluation', {
        evaluationProgress: 'overdue',
        evaluationModule: 'Module 1',
      }),
    ).toEqual({
      types: ['evaluation'],
      assignmentProgressStatuses: ['overdue'],
      modules: ['Module 1'],
    })
  })

  it('maps lecture type and attendance filters', () => {
    expect(
      supportCategoryToLearnFilters('lecture', {
        lectureType: 'live',
        attendanceStatus: 'present',
      }),
    ).toEqual({
      types: ['live'],
      attendanceStatus: 'present',
    })

    expect(
      supportCategoryToLearnFilters('lecture', {
        lectureType: 'scrum',
      }),
    ).toEqual({
      types: ['scrum'],
    })
  })

  it('ignores "any" floater filter values', () => {
    expect(
      supportCategoryToLearnFilters('assignment', {
        assignmentPriority: 'any',
        assignmentCategory: 'any',
      }),
    ).toEqual({
      types: ['assignment', 'practice'],
    })
  })
})
