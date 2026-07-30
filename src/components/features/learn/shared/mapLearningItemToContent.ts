import type { LearningItem } from '@/server/learn/types'
import {
  formatScheduleRangeIST,
  formatScheduleRangeLocal,
} from '@/utils/timeZoneHandler'

import type { LearnContentItem } from './types'

/**
 * Maps a server `LearningItem` DTO to the client `LearnContentItem` consumed by
 * `LearnContentCard`. Shared by the `/learn` listing and the associated-content
 * surfaces so both render an identical card.
 */
export function mapLearningItemToContent(item: LearningItem): LearnContentItem {
  return {
    id: item.id,
    type: item.learningType,
    title: item.title,
    hostName: item.hostName,
    date: formatScheduleRangeLocal(item.scheduleDate, item.concludes) || null,
    dateTooltip:
      formatScheduleRangeIST(item.scheduleDate, item.concludes) || null,
    category: item.category,
    learningSubType: item.type,
    priority: item.isOptional,
    tags: [item.type, item.category, item.moduleName],
    attendance: item.attendance,
    optionalAttendance: item.optionalAttendance,
    assignmentProgressStatus: item.assignmentProgressStatus,
    resourcePhase: item.resourcePhase,
    listingCtas: item.listingCtas,
    assignmentStatusChip: item.listingCtas.assignmentStatusChip,
    assignmentDeadlineLabel: item.listingCtas.assignmentDeadlineLabel,
    assignmentScore: item.listingCtas.assignmentScore,
    assignmentWeightage: item.assignmentWeightage,
  }
}
