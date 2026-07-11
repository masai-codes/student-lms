import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type {
  AssignmentListingStatusChip,
  LearnListingCardCtas,
} from '@/server/learn/types'
import type { AssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'
import type { ResourcePhase } from '@/server/learn/resourceDetailTypes'

export type LearnTab = 'lectures' | 'assignments' | 'resources'

export type LearnContentType = 'lecture' | 'assignment' | 'resource'
export type LearnPriority = 'recommended' | 'mandatory'

export interface LearnContentItem {
  id: number
  type: LearnContentType
  title: string
  hostName: string
  date: string | null
  category: string
  learningSubType: string
  priority: LearnPriority
  tags: Array<string>
  attendance: LectureAttendanceSummary | null
  assignmentProgressStatus: AssignmentProgressStatus | null
  resourcePhase: ResourcePhase | null
  listingCtas: LearnListingCardCtas
  assignmentStatusChip: AssignmentListingStatusChip
  /**
   * Dashboard-only "which course" label, shown after the date when the student
   * is in more than one batch. Absent/null on the /learn page.
   */
  courseName?: string | null
  /** Dashboard-only hover tooltip for the date (IST range). Absent on /learn. */
  dateTooltip?: string | null
  /** "N days/hours remaining" until an assignment deadline; null otherwise. */
  assignmentDeadlineLabel?: string | null
  /** Released score (clamped to 10) to show as a card badge; null unless `showScores` is on and the score is released. */
  assignmentScore?: number | null
}

export interface LearnFilterValues {
  moduleFilterValues: Array<string>
  categoryFilterValues: Array<string>
  typeFilterValues: Array<string>
  priorityFilterValues: Array<LearnPriority>
  instructorFilterValues: Array<string>
}

export type LearnSchedulePhase = 'all' | 'upcoming' | 'past'
export type LearnAttendanceFilter = 'present' | 'absent'
export type LearnAssignmentProgressFilter = 'all' | AssignmentProgressStatus

export interface LearnModalFiltersState {
  modules: Array<string>
  categories: Array<string>
  types: Array<string>
  priorities: Array<LearnPriority>
  instructors: Array<string>
  /** Inclusive schedule lower bound (`yyyy-mm-dd`). Filters by item `scheduleDate`. */
  scheduleStartDate: string | null
  /** Inclusive schedule upper bound (`yyyy-mm-dd`). */
  scheduleEndDate: string | null
  /** Lectures: upcoming vs past session window. */
  schedulePhase: LearnSchedulePhase
  /** Lectures: attendance facet (mandatory lectures only). */
  attendanceStatus: LearnAttendanceFilter | null
  /** Assignments: progress chip filter. */
  assignmentProgress: LearnAssignmentProgressFilter
}

export function createEmptyLearnModalFilters(): LearnModalFiltersState {
  return {
    modules: [],
    categories: [],
    types: [],
    priorities: [],
    instructors: [],
    scheduleStartDate: null,
    scheduleEndDate: null,
    schedulePhase: 'all',
    attendanceStatus: null,
    assignmentProgress: 'all',
  }
}
