export interface EnrolledBatch {
  batchId: number
  courseTitle: string
  /** From `batches.meta.courseLogo` when present (image URL). */
  courseLogo: string | null
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

export interface DiscussionAuthorPreview {
  id: number
  name: string | null
}

/** Discussion rows scoped to the learn entity (assignment or lecture/resource); visibility enforced server-side. */
export interface DiscussionListItem {
  id: number
  title: string
  messagePreview: string
  isClosed: boolean
  isPublic: boolean
  createdAt: string | null
  updatedAt: string | null
  threadCount: number
  author: DiscussionAuthorPreview | null
}

/**
 * Presentation payload for /lectures/:id, /assignments/:id, /resources/:id.
 * Mirrors listing card fields — all strings/arrays are finalized on the server.
 */
export type {
  LectureDetailPayload,
  LectureDetailTabContent,
  LectureKind,
  LiveLecturePhase,
  VideoLecturePhase,
} from '@/server/learn/lectureDetailTypes'

export interface LearnHubDetailPayload {
  id: number
  title: string
  hostName: string
  displayDate: string
  priority: LearningPriority
  /** Same chip labels as the learn listing card (`type`, `category`, `moduleName`). */
  tags: Array<string>
  /** Loaded with the detail response (student-visible discussions only). */
  discussions: Array<DiscussionListItem>
}
