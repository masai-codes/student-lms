'use client'

import {
  LearnDetailBodyGrid,
  LearnDetailDefaultActions,
  LearnDetailOverview,
} from '../common'
import type { LearnHubDetailPayload } from '@/server/learn/types'
import { EntityDiscussionsPanel } from '@/components/features/new-discussions'


type LectureDetailPageProps = {
  detail: LearnHubDetailPayload
}

export function LectureDetailPage({ detail }: LectureDetailPageProps) {
  return (
    <div className="w-full space-y-6 pb-12">
    </div>
  )
}
