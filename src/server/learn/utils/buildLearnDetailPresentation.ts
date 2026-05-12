import type { LearnHubDetailPayload, LearningPriority } from '@/server/learn/types'
import {
  resolveModuleName,
  toLearningPriority,
} from '@/server/learn/utils/learningDataMappers'
import { formatSqlDate } from '@/utils/generics'

type LearnLikeRow = {
  id: number
  title: string
  category: string
  type: string
  optional: number | null
  schedule: string | null
  week: number
  module: string | null
  hostName: string | null
}

function formatScheduleDisplay(schedule: string | null): string {
  if (schedule == null || schedule.trim() === '') {
    return 'No schedule'
  }
  return formatSqlDate(schedule)
}

type LearnDetailCore = Omit<LearnHubDetailPayload, 'discussions'>

/** Final values for the detail page (tags / date / host / priority computed here, not in the client). */
export function buildLearnDetailPresentation(row: LearnLikeRow): LearnDetailCore {
  const hostName =
    row.hostName != null && row.hostName.trim() !== ''
      ? row.hostName.trim()
      : 'Unknown Instructor'

  const moduleName = resolveModuleName(row.module, row.week)
  const tags = [row.type, row.category, moduleName]
  const priority: LearningPriority = toLearningPriority(row.optional)

  return {
    id: row.id,
    title: row.title,
    hostName,
    displayDate: formatScheduleDisplay(row.schedule),
    priority,
    tags,
  }
}
