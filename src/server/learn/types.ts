import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type { AssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'
import type { ResourcePhase } from '@/server/learn/resourceDetailTypes'

import type { LearnDiscussionThreadItem } from '@/server/new-discussions/types/learnDiscussionDetail'

export interface EnrolledBatch {
  batchId: number
  courseTitle: string
  /** From `batches.meta.courseLogo` when present (image URL). */
  courseLogo: string | null
  showAttendanceReport: boolean
  showEvaluationReport: boolean
  /** `batches.settings.showBatchDetails` — gates the "Course Details" link (legacy LMS). */
  showBatchDetails: boolean
  /** `batches.meta.showSectionDropdown` — gates the section (Course) filter in the learn header. */
  showSectionDropdown: boolean
}

export interface EnrolledBatchRow {
  id: number
  name: string
  meta: unknown
  settings: unknown
}

/** A section the user is enrolled in for a given batch — powers the section filter. */
export interface EnrolledSection {
  sectionId: number
  name: string
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
  /**
   * Join URL for the live session (scrubbed + lecture-scoped), or null. For
   * `isNewZoomRedirection` lectures this is only a fallback — the real URL is
   * minted at click time via the zoom-redirect API.
   */
  joinZoomLink: string | null
  /** When true, join via the ZEF redirect flow instead of the raw zoom link. */
  isNewZoomRedirection: boolean
  /**
   * `sections.settings.enableZoomWebView`. When true (non-adaptive, non-ZEF
   * link), the join CTA opens the old LMS embedded Zoom page (`/lectures/:id/zoom`).
   */
  enableZoomWebView: boolean
  showAttendance: boolean
  assignmentStatusChip: AssignmentListingStatusChip
  /** "N days/hours remaining" until an assignment deadline; null otherwise. */
  assignmentDeadlineLabel: string | null
  /** Released score (clamped to 10) to show on the card; null unless `showScores` is on and the score is released. */
  assignmentScore: number | null
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
  /**
   * Narrows the listing to a single enrolled section. Ignored when the user is not
   * enrolled in it — the listing then spans all of the user's sections in the batch.
   */
  sectionId?: number
  /**
   * How far into the future the default schedule window extends, in days.
   * `0`/undefined = up to end of today (legacy default); `7` / `30` add that many days.
   */
  scheduleHorizonDays?: number
}

export interface LearningItem {
  id: number
  learningType: LearningType
  title: string
  hostName: string
  scheduleDate: string | null
  /** End time (IST wall-clock); pairs with `scheduleDate` for a display range. */
  concludes: string | null
  type: string
  category: string
  isOptional: LearningPriority
  moduleName: string
  /** Present for mandatory lectures only; null for assignments/resources/optional lectures. */
  attendance: LectureAttendanceSummary | null
  /**
   * Present for optional (recommended) lectures only; null otherwise. Powers the
   * optional-session info tooltip on the card — optional lectures never show the
   * regular attendance badge, so this is the only place their status surfaces.
   */
  optionalAttendance: LectureAttendanceSummary | null
  /** Present for assignments only. */
  assignmentProgressStatus: AssignmentProgressStatus | null
  /** `assignments.settings.weightagePercentage`; null when unset or not an assignment. */
  assignmentWeightage: number | null
  /** Present for resources only. */
  resourcePhase: ResourcePhase | null
  /** Listing card CTAs — resolved on the server to match legacy LMS rules. */
  listingCtas: LearnListingCardCtas
  /**
   * The item's section label (display name, else the section code). Only
   * populated on the `/learn` listing feed — the IIT Jodhpur portal renders it as
   * an extra card chip. Null on the dashboard and associated-content feeds.
   */
  sectionName?: string | null
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
  /** Sections the user is enrolled in for the resolved batch (for the section filter). */
  sections: Array<EnrolledSection>
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
  /** Narrows the listing to a single enrolled section (ignored when not enrolled). */
  sectionId?: number
  /** Future window size in days for the default schedule window (0 = up to today). */
  scheduleHorizonDays?: number
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
  /** Unread replies for the discussion owner (replies by others not yet marked read). Always 0 for non-owners. */
  unreadReplyCount: number
  /** Owner's 1–5 rating of how the discussion was resolved, or null when not rated. */
  feedbackRating: number | null
  author: DiscussionAuthorPreview | null
  /** Reply threads loaded with the detail page (empty on non-detail listings). */
  threads: Array<LearnDiscussionThreadItem>
}

/** A discussion in the batch-wide `/learn/discussions` feed, with its source content attached. */
export interface LearnDiscussionListItem extends DiscussionListItem {
  contentType: 'lecture' | 'assignment' | 'resource'
  contentId: number
  contentTitle: string
}

/**
 * Presentation payload for /lectures/:id, /assignments/:id, /resources/:id.
 * Mirrors listing card fields — all strings/arrays are finalized on the server.
 */

/**
 * Backend-computed restriction for a detail page (see `@/server/restrictions`).
 * The frontend renders the matching gated UI purely from this value — it never
 * derives the restriction itself.
 */

import type { LearnDetailRestriction } from '@/server/restrictions/types'

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
  /** Set when the signed-in user is restricted from (part of) this content. */
  restriction?: LearnDetailRestriction | null
}
