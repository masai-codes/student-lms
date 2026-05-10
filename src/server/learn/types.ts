export interface EnrolledBatch {
  batchId: number
  courseTitle: string
}

export interface EnrolledBatchRow {
  id: number
  name: string
  meta: unknown
}

export type LearningType = 'lecture' | 'assignment' | 'resource'
export type LearningPriority = 'recommended' | 'mandatory'

export interface BatchLearningFiltersInput {
  modules?: Array<string>
  categories?: Array<string>
  types?: Array<string>
  priorities?: Array<LearningPriority>
  instructors?: Array<string>
  /** Inclusive; `yyyy-mm-dd` against schedule timestamps. */
  scheduleStartDate?: string
  scheduleEndDate?: string
}

export interface GetBatchLearningDataInput {
  batchId: number
  learningType: LearningType
  search?: string
  page?: number
  pageSize?: number
  filters?: BatchLearningFiltersInput
}

export interface LearningItem {
  id: number
  learningType: LearningType
  title: string
  hostName: string
  scheduleDate: string | null
  type: string
  category: string
  isOptional: LearningPriority
  moduleName: string
}

export interface LearningFilterValues {
  moduleFilterValues: Array<string>
  categoryFilterValues: Array<string>
  typeFilterValues: Array<string>
  priorityFilterValues: Array<LearningPriority>
  instructorFilterValues: Array<string>
}

export interface LearningPagination {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface GetBatchLearningDataResponse {
  filterValues: LearningFilterValues
  learningItems: Array<LearningItem>
  pagination: LearningPagination
}
