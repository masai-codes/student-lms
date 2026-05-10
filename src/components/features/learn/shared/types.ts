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
  tags: string[]
}

export interface LearnFilterValues {
  moduleFilterValues: Array<string>
  categoryFilterValues: Array<string>
  typeFilterValues: Array<string>
  priorityFilterValues: Array<LearnPriority>
  instructorFilterValues: Array<string>
}

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
  }
}
