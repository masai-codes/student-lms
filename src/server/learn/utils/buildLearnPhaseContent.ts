import type { LearnPhaseContent } from '@/server/learn/learnPhaseContentTypes'
import type {
  AssignmentKind,
  AssignmentPhase,
} from '@/server/learn/assignmentDetailTypes'
import type { ResourceKind, ResourcePhase } from '@/server/learn/resourceDetailTypes'
import { getAssignmentPhaseCopy } from '@/server/learn/utils/getAssignmentPhaseCopy'
import { getResourcePhaseCopy } from '@/server/learn/utils/getResourcePhaseCopy'
import { formatSqlDate } from '@/utils/generics'

function formatOpensAtLabel(schedule: string | null): string {
  if (schedule == null || schedule.trim() === '') {
    return 'the scheduled time'
  }
  return formatSqlDate(schedule)
}

export function buildAssignmentPhaseContent(
  kind: AssignmentKind,
  phase: AssignmentPhase,
  schedule: string | null,
): LearnPhaseContent {
  const copy = getAssignmentPhaseCopy(kind, phase)
  const scheduleHint =
    phase === 'before' ? `Opens ${formatOpensAtLabel(schedule)}.` : null

  return {
    title: copy.title,
    description: copy.description,
    scheduleHint,
  }
}

export function buildResourcePhaseContent(
  kind: ResourceKind,
  phase: ResourcePhase,
  schedule: string | null,
): LearnPhaseContent {
  const copy = getResourcePhaseCopy(kind, phase)
  const scheduleHint =
    phase === 'before' ? `Unlocks ${formatOpensAtLabel(schedule)}.` : null

  return {
    title: copy.title,
    description: copy.description,
    scheduleHint,
  }
}
