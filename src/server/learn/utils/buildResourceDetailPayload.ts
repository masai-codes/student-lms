import type {
  ResourceDetailPayload,
  ResourceKind,
} from '@/server/learn/resourceDetailTypes'
import type { LearnAssociatedListItem } from '@/server/learn/learnAssociatedTypes'
import type { LearnHubDetailPayload } from '@/server/learn/types'
import { formatLectureScheduleRange } from '@/server/learn/utils/formatLectureScheduleRange'
import { normalizeResourceKind } from '@/server/learn/utils/normalizeResourceKind'
import { resolveAssignmentPhase } from '@/server/learn/utils/resolveAssignmentPhase'
import { buildResourcePhaseContent } from '@/server/learn/utils/buildLearnPhaseContent'
import { normalizeNullableText } from '@/server/learn/utils/normalizeNullableText'
import { parseLectureSettings } from '@/server/learn/utils/parseLectureSettings'

type ResourceDetailRow = {
  category: string
  schedule: string | null
  concludes: string | null
  hostAvatarUrl: string | null
  notes: string | null
  description: string | null
  settings: unknown
}

export function buildResourceDetailPayload(
  core: LearnHubDetailPayload,
  row: ResourceDetailRow,
  nowMs: number,
  associatedItems: Array<LearnAssociatedListItem>,
  isBookmarked: boolean,
): ResourceDetailPayload {
  const resourceKind: ResourceKind = normalizeResourceKind(row.category)
  const phase = resolveAssignmentPhase({
    schedule: row.schedule,
    concludes: row.concludes,
    nowMs,
  })

  const settings = parseLectureSettings(row.settings)
  const notes = normalizeNullableText(row.notes)
  const description = normalizeNullableText(row.description)
  const body = notes ?? description

  return {
    ...core,
    associatedItems,
    resourceKind,
    phase,
    schedule: row.schedule,
    concludes: row.concludes,
    scheduleDisplayRange: formatLectureScheduleRange(row.schedule, row.concludes),
    hostAvatarUrl: row.hostAvatarUrl,
    body,
    hideNotes: settings.hideNotes,
    phaseContent: buildResourcePhaseContent(resourceKind, phase, row.schedule),
    isBookmarked,
  }
}
