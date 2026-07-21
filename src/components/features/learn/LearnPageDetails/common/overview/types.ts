import type { ReactNode } from 'react'

import type { LearningPriority } from '@/server/learn/types'

export type LearnDetailOverviewProps = {
  title: string
  hostName: string
  displayDate: string
  /** Same date in IST; shown on hover when the viewer isn't in IST. */
  displayDateIst?: string
  priority: LearningPriority
  tags: Array<string>
  /** Right-aligned actions (Raise ticket, bookmark, etc.). */
  actions?: ReactNode
  /** Extra chips rendered after the priority chip in the meta row. */
  trailingChips?: ReactNode
}
