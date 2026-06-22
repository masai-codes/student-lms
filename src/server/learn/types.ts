import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type { AssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'
import type { ResourcePhase } from '@/server/learn/resourceDetailTypes'

import type { LearnDiscussionThreadItem } from '@/server/new-discussions/types/learnDiscussionDetail'

export type { LectureAttendanceSummary }

export interface EnrolledBatch {
  batchId: number
  courseTitle: string
  /** From `batches.meta.courseLogo` when present (image URL). */
  courseLogo: string | null
  showAttendanceReport: boolean
  showEvaluationReport: boolean
}

export interface EnrolledBatchRow {
  id: number
  name: string
  meta: unknown
  settings: unknown
}

export type LearningType = 'lecture' | 'assignment' | 'resource'
export type LearningPriority = 'recommended' | 'mandatory'

export type LearnListingJoinLiveState = 'hidden' | 'disabled' | 'active'

/** Assignment status chip on learn listing cards (legacy AssignmentListCard rules). */
export type AssignmentListingStatusChip =
  | AssignmentProgressStatus
  | 'practice-mode'
  | null

/** Server-resolved CTA visibility for learn listing cards — see `buildLearnListingCardCtas`. */
export interface LearnListingCardCtas {
  joinLive: LearnListingJoinLiveState
  showAttendance: boolean
  assignmentStatusChip: AssignmentListingStatusChip
}

export type LearnSchedulePhaseFilter = 'all' | 'upcoming' | 'past'
export type LearnAttendanceStatusFilter = 'present' | 'absent'

export interface BatchLearningFiltersInput {
  modules?: Array<string>
  categories?: Array<string>
  types?: Array<string>
  priorities?: Array<LearningPriority>
  instructors?: Array<string>
  /** Inclusive; `yyyy-mm-dd` against schedule timestamps. */
  scheduleStartDate?: string
  scheduleEndDate?: string
  /** Lectures/resources: upcoming (not ended) vs past (ended). */
  schedulePhase?: LearnSchedulePhaseFilter
  /** Mandatory lectures with attendance rows only. */
  attendanceStatus?: LearnAttendanceStatusFilter
  /** Assignments: progress chip statuses (omit or empty = all). */
  assignmentProgressStatuses?: Array<AssignmentProgressStatus>
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
  /** Present for mandatory lectures only; null for assignments/resources/optional lectures. */
  attendance: LectureAttendanceSummary | null
  /** Present for assignments only. */
  assignmentProgressStatus: AssignmentProgressStatus | null
  /** Present for resources only. */
  resourcePhase: ResourcePhase | null
  /** Listing card CTAs — resolved on the server to match legacy LMS rules. */
  listingCtas: LearnListingCardCtas
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

/** Single learn-page request: `batchId` optional (server defaults to the first enrolled batch). */
export interface GetLearnPageDataInput {
  batchId?: number
  learningType: LearningType
  search?: string
  page?: number
  pageSize?: number
  filters?: BatchLearningFiltersInput
}

/** Everything the `/learn` page renders in one response: batch selector + listing. */
export interface GetLearnPageDataResponse extends GetBatchLearningDataResponse {
  batches: Array<EnrolledBatch>
  selectedBatchId: number | null
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
  /** Reply threads loaded with the detail page (empty on non-detail listings). */
  threads: Array<LearnDiscussionThreadItem>
}

/**
 * Presentation payload for /lectures/:id, /assignments/:id, /resources/:id.
 * Mirrors listing card fields — all strings/arrays are finalized on the server.
 */
export type {
  AssignmentDetailPayload,
  AssignmentKind,
  AssignmentPhase,
} from '@/server/learn/assignmentDetailTypes'

export type {
  ResourceDetailPayload,
  ResourceKind,
  ResourcePhase,
} from '@/server/learn/resourceDetailTypes'

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
