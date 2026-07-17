import type { LearnContentItem, LearnTab } from './types'

export const enrolledBatches = [
  'Cohort Alpha - Full Stack',
  'Cohort Beta - Data Science',
  'Cohort Gamma - DevOps',
]

export const moduleFilters = ['All Modules', 'Module 1', 'Module 2', 'Module 3']

const hostNames = [
  'Ananya Singh',
  'Rohit Verma',
  'Priya Nair',
  'Karan Mehta',
  'Sneha Patel',
  'Arjun Rao',
]

const priorities: Array<LearnContentItem['priority']> = [
  'recommended',
  'mandatory',
]

function createDummyItems(
  kind: LearnContentItem['type'],
  titlePrefix: string,
): Array<LearnContentItem> {
  return Array.from({ length: 20 }, (_, index) => {
    const itemNumber = index + 1
    const moduleName = `Module ${((index % 3) + 1).toString()}`

    return {
      id: itemNumber,
      type: kind,
      title: `${titlePrefix} ${itemNumber}`,
      hostName: hostNames[index % hostNames.length],
      date: `${((index % 28) + 1).toString().padStart(2, '0')} May 2026`,
      category: moduleName,
      learningSubType: index % 2 === 0 ? 'Live' : 'Faculty',
      priority: priorities[index % priorities.length],
      tags: ['Live', 'Faculty', 'Recommended', moduleName],
      attendance: null,
      optionalAttendance: null,
      assignmentProgressStatus: null,
      resourcePhase: null,
      listingCtas: {
        joinLive: 'hidden',
        joinZoomLink: null,
        isNewZoomRedirection: false,
        enableZoomWebView: false,
        showAttendance: false,
        assignmentStatusChip: null,
        assignmentDeadlineLabel: null,
        assignmentScore: null,
      },
      assignmentStatusChip: null,
    }
  })
}

export const dummyContentByTab: Record<LearnTab, LearnContentItem[]> = {
  lectures: createDummyItems('lecture', 'Lecture Topic'),
  assignments: createDummyItems('assignment', 'Assignment Task'),
  resources: createDummyItems('resource', 'Resource Material'),
}

export const dummyFilterOptions = [
  'Only live sessions',
  'Only recommended',
  'Only faculty sessions',
  'Show completed first',
]
