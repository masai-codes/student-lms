import type { LearnPhaseContent } from '@/server/learn/learnPhaseContentTypes'
import type {
  AssignmentKind,
  AssignmentPhase,
} from '@/server/learn/assignmentDetailTypes'
import type { ResourceKind, ResourcePhase } from '@/server/learn/resourceDetailTypes'
import { getAssignmentPhaseCopy } from '@/server/learn/utils/getAssignmentPhaseCopy'
import { getResourcePhaseCopy } from '@/server/learn/utils/getResourcePhaseCopy'
import { parseIstToMs } from '@/server/time/istClock'

// IST-pinned formatter. The DB stores schedule as IST wall-clock time; format
// the display in Asia/Kolkata explicitly so it does not shift with the server's
// timezone (formatSqlDate used local getters and drifted on non-IST hosts).
const OPENS_AT_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Kolkata',
}

function formatOpensAtLabel(schedule: string | null): string {
  if (schedule == null || schedule.trim() === '') {
    return 'the scheduled time'
  }
  const ms = parseIstToMs(schedule)
  if (ms == null) {
    return 'the scheduled time'
  }
  return new Intl.DateTimeFormat('en-IN', OPENS_AT_FORMAT).format(new Date(ms))
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
