import type {
  AssignmentDetailPayload,
  AssignmentKind,
} from '@/server/learn/assignmentDetailTypes'
import type { LearnHubDetailPayload } from '@/server/learn/types'
import {
  buildAssignmentDetailFooter,
  type AssignmentDetailFooterContext,
} from '@/server/learn/utils/buildAssignmentDetailFooter'
import { formatLectureScheduleRange } from '@/server/learn/utils/formatLectureScheduleRange'
import { buildAssignmentPhaseContent } from '@/server/learn/utils/buildLearnPhaseContent'
import { resolveAssignmentPhase } from '@/server/learn/utils/resolveAssignmentPhase'

type AssignmentDetailRow = {
  type: string
  category: string
  platform: string | null
  showScores: number
  showSubmission: number
  settings: Record<string, unknown> | null
  schedule: string | null
  concludes: string | null
  hostAvatarUrl: string | null
  instructions: string | null
  enforceDeadline: number | null
}

const SUPPORTED_ASSIGNMENT_KINDS = new Set<AssignmentKind>([
  'practice',
  'assignment',
  'evaluation',
])

function normalizeAssignmentKind(type: string): AssignmentKind | null {
  const normalized = type.trim().toLowerCase()
  if (
    normalized === 'practice' ||
    normalized === 'assignment' ||
    normalized === 'evaluation'
  ) {
    return normalized
  }
  return null
}

export type AssignmentDetailFooterInput = Pick<
  AssignmentDetailFooterContext,
  'problemCount' | 'submission'
>

export function buildAssignmentDetailPayload(
  core: LearnHubDetailPayload,
  row: AssignmentDetailRow,
  nowMs: number,
  footerInput: AssignmentDetailFooterInput,
): AssignmentDetailPayload {
  const assignmentKind = normalizeAssignmentKind(row.type)
  if (assignmentKind == null) {
    throw new Error('ASSIGNMENT_DETAIL_UNSUPPORTED_TYPE')
  }

  const phase = resolveAssignmentPhase({
    schedule: row.schedule,
    concludes: row.concludes,
    nowMs,
  })

  const instructions =
    row.instructions != null && row.instructions.trim() !== ''
      ? row.instructions.trim()
      : null

  const footer = buildAssignmentDetailFooter({
    assignmentKind,
    category: row.category,
    platform: row.platform,
    showScores: row.showScores === 1,
    showSubmission: row.showSubmission === 1,
    settings: row.settings,
    schedule: row.schedule,
    concludes: row.concludes,
    nowMs,
    problemCount: footerInput.problemCount,
    submission: footerInput.submission,
  })

  return {
    ...core,
    assignmentKind,
    phase,
    schedule: row.schedule,
    concludes: row.concludes,
    scheduleDisplayRange: formatLectureScheduleRange(row.schedule, row.concludes),
    hostAvatarUrl: row.hostAvatarUrl,
    instructions,
    enforceDeadline: row.enforceDeadline === 1,
    phaseContent: buildAssignmentPhaseContent(assignmentKind, phase, row.schedule),
    footer,
  }
}

export function isSupportedAssignmentDetailType(type: string): boolean {
  return SUPPORTED_ASSIGNMENT_KINDS.has(
    type.trim().toLowerCase() as AssignmentKind,
  )
}
