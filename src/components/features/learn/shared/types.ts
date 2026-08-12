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
  /** Present for optional (recommended) lectures only; powers the info tooltip. */
  optionalAttendance: LectureAttendanceSummary | null
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
  /** `assignments.settings.weightagePercentage`; rendered as a chip beside the tags. */
  assignmentWeightage?: number | null
  /**
   * Section label for the item, set only by the `/learn` listing feed. Rendered as
   * a chip after the tags on portals in `SECTION_ON_LEARN_CARD_PORTALS` (IIT
   * Jodhpur today). Absent on the dashboard and associated-content cards.
   */
  sectionName?: string | null
}

interface LearnFilterValues {
  moduleFilterValues: Array<string>
  categoryFilterValues: Array<string>
  typeFilterValues: Array<string>
  priorityFilterValues: Array<LearnPriority>
  instructorFilterValues: Array<string>
}

/**
 * Top-level future window for the listing (independent of the modal date filter).
 * `today` is the legacy default (past + today); the others extend into the future.
 */
export type LearnScheduleHorizon = 'today' | 'next7' | 'next30'

export const LEARN_SCHEDULE_HORIZON_OPTIONS: ReadonlyArray<{
  value: LearnScheduleHorizon
  label: string
}> = [
  { value: 'today', label: 'Upto Today' },
  { value: 'next7', label: 'Upto next 7 days' },
  { value: 'next30', label: 'Upto next 30 days' },
]

export function parseLearnScheduleHorizon(
  value: unknown,
): LearnScheduleHorizon {
  return value === 'next7' || value === 'next30' ? value : 'today'
}

/** Days added to the default "up to today" ceiling for a given horizon. */
export function learnScheduleHorizonToDays(
  horizon: LearnScheduleHorizon,
): number | undefined {
  if (horizon === 'next7') return 7
  if (horizon === 'next30') return 30
  return undefined
}

type LearnSchedulePhase = 'all' | 'upcoming' | 'past'
type LearnAttendanceFilter = 'present' | 'absent'
type LearnAssignmentProgressFilter = 'all' | AssignmentProgressStatus

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
