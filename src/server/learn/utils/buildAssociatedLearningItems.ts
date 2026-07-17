import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type { LearningItem } from '@/server/learn/types'
import { buildLearnListingCardCtas } from '@/server/learn/utils/buildLearnListingCardCtas'
import {
  calculateAssignmentProgressStatus,
  type AssignmentSubmissionProgress,
} from '@/server/learn/utils/calculateAssignmentProgressStatus'
import {
  mapLearningEntityRow,
  toLearningPriority,
} from '@/server/learn/utils/learningDataMappers'
import { resolveEnableZoomWebView } from '@/server/learn/utils/resolveEnableZoomWebView'
import { resolveAssignmentPhase } from '@/server/learn/utils/resolveAssignmentPhase'
import { resolveLectureLearningType } from '@/server/learn/utils/resolveLectureLearningType'
import { resolveReleasedAssignmentScore } from '@/server/learn/utils/resolveReleasedAssignmentScore'

// Column shapes for a section's lecture/assignment rows, matching the `/learn`
// listing selects so associated items are built through the exact same pipeline.
export type AssociatedLectureRow = {
  id: number
  title: string
  category: string
  type: string
  optional: number | null
  schedule: string | null
  concludes: string | null
  sectionId: number | null
  week: number
  module: string | null
  hostName: string | null
  zoomLink: string | null
  isNewZoomRedirection: number | null
  sectionSettings?: unknown
}

export type AssociatedAssignmentRow = {
  id: number
  title: string
  category: string
  type: string
  optional: number | null
  schedule: string | null
  concludes: string | null
  week: number
  module: string | null
  hostName: string | null
  showScores: number | null
}

/**
 * Builds a listing-identical `LearningItem` for an associated lecture/resource
 * row. Reuses `buildLearnListingCardCtas` + `mapLearningEntityRow` (the same
 * builders `/learn` uses) so the associated UI renders the same card.
 */
export function buildAssociatedLectureItem(
  row: AssociatedLectureRow,
  attendance: LectureAttendanceSummary | null,
  nowMs: number,
): LearningItem {
  const learningType = resolveLectureLearningType(row.type)

  const listingCtas = buildLearnListingCardCtas({
    learningType,
    lectureId: row.id,
    itemType: row.type,
    schedule: row.schedule,
    concludes: row.concludes,
    isMandatory: toLearningPriority(row.optional) === 'mandatory',
    zoomLink: row.zoomLink,
    isNewZoomRedirection: row.isNewZoomRedirection === 1,
    enableZoomWebView: resolveEnableZoomWebView(row.sectionSettings),
    nowMs,
    attendance,
    assignmentProgressStatus: null,
    assignmentScore: null,
  })

  const resourcePhase =
    learningType === 'resource'
      ? resolveAssignmentPhase({
          schedule: row.schedule,
          concludes: row.concludes,
          nowMs,
        })
      : null

  return mapLearningEntityRow(
    row,
    learningType,
    listingCtas,
    attendance,
    null,
    resourcePhase,
  )
}

/** Builds a listing-identical `LearningItem` for an associated assignment row. */
export function buildAssociatedAssignmentItem(
  row: AssociatedAssignmentRow,
  submission: AssignmentSubmissionProgress,
  nowMs: number,
): LearningItem {
  const assignmentProgressStatus = calculateAssignmentProgressStatus({
    schedule: row.schedule,
    concludes: row.concludes,
    nowMs,
    submission,
  })

  const assignmentScore = resolveReleasedAssignmentScore({
    showScores: row.showScores === 1,
    submission,
  })

  const listingCtas = buildLearnListingCardCtas({
    learningType: 'assignment',
    lectureId: row.id,
    itemType: row.type,
    schedule: row.schedule,
    concludes: row.concludes,
    isMandatory: toLearningPriority(row.optional) === 'mandatory',
    zoomLink: null,
    isNewZoomRedirection: false,
    enableZoomWebView: false,
    nowMs,
    attendance: null,
    assignmentProgressStatus,
    assignmentScore,
  })

  return mapLearningEntityRow(
    row,
    'assignment',
    listingCtas,
    null,
    assignmentProgressStatus,
    null,
  )
}
