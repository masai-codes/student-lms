import { BookOpen, FileText, PlayCircle } from '@phosphor-icons/react'
import type { ScheduleItemType } from './types'

interface ScheduleTypeVisual {
  Icon: typeof PlayCircle
  /** Tailwind text-color class for the leading icon. */
  colorClass: string
}

// Maps a schedule item type to its leading icon + accent colour so cards stay
// visually consistent and new types only need a single entry here.
const SCHEDULE_TYPE_VISUALS: Record<ScheduleItemType, ScheduleTypeVisual> = {
  lecture: { Icon: PlayCircle, colorClass: 'text-[#4F46E5]' },
  assignment: { Icon: FileText, colorClass: 'text-[#0EA5A5]' },
  notes: { Icon: BookOpen, colorClass: 'text-[#F97316]' },
}

export function getScheduleTypeVisual(type: ScheduleItemType): ScheduleTypeVisual {
  return SCHEDULE_TYPE_VISUALS[type]
}
