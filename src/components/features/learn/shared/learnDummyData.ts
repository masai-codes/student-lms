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

const attendanceStatuses: Array<LearnContentItem['attendanceStatus']> = [
  'Present',
  'Absent',
  'Pending',
]

function createDummyItems(
  kind: LearnContentItem['type'],
  titlePrefix: string
): Array<LearnContentItem> {
  return Array.from({ length: 20 }, (_, index) => {
    const itemNumber = index + 1
    const moduleName = `Module ${((index % 3) + 1).toString()}`
    const day = ((index % 28) + 1).toString().padStart(2, '0')

    return {
      id: `${kind}-${itemNumber}`,
      type: kind,
      title: `${titlePrefix} ${itemNumber}`,
      hostName: hostNames[index % hostNames.length],
      date: `${day} May 2026`,
      tags: ['Live', 'Faculty', 'Recommended', moduleName],
      attendanceStatus: attendanceStatuses[index % attendanceStatuses.length],
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
