import type { ReactNode } from 'react'

import type { LearningPriority } from '@/server/learn/types'

export type LearnDetailOverviewProps = {
  title: string
  hostName: string
  displayDate: string
  priority: LearningPriority
  tags: Array<string>
  /** Right-aligned actions (Raise ticket, bookmark, etc.). */
  actions?: ReactNode
}
