'use client'

import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import type { AssignmentLiveAnalytics as AssignmentLiveAnalyticsData } from '@/server/learn/utils/buildAssignmentLiveAnalytics'
import { MasaiButton } from '@/components/ui/masai-button'

type AssignmentLiveAnalyticsProps = {
  liveAnalytics: AssignmentLiveAnalyticsData | null
}

const METRICS: Array<{
  key: keyof AssignmentLiveAnalyticsData
  label: string
  dotClassName: string
}> = [
  { key: 'totalQuestions', label: 'Total questions', dotClassName: 'bg-[#9333EA]' },
  { key: 'attempted', label: 'Attempted questions', dotClassName: 'bg-[#8F6B00]' },
  { key: 'notGraded', label: 'Not graded questions', dotClassName: 'bg-[#FB923C]' },
  { key: 'correct', label: 'Correct answers', dotClassName: 'bg-[#15803D]' },
  { key: 'wrong', label: 'Wrong answers', dotClassName: 'bg-[#FC214C]' },
]

function formatMetric(value: number | null): string {
  return value == null ? '--' : String(value)
}

/** Assessment Platform live progress widget with a manual refetch. */
export function AssignmentLiveAnalytics({
  liveAnalytics,
}: AssignmentLiveAnalyticsProps) {
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)

  if (liveAnalytics == null) {
    return null
  }

  const handleRefetch = async () => {
    setRefreshing(true)
    try {
      await router.invalidate()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div
      className="rounded-xl border border-[#C0D9FF] bg-[#F2F6FF] p-4"
      data-testid="assignment-live-analytics"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {METRICS.map((metric) => (
          <div key={metric.key} className="flex items-center gap-2">
            <span className={`size-2 shrink-0 rounded-full ${metric.dotClassName}`} aria-hidden />
            <span className="type-b3-md text-gray-600">{metric.label}</span>
            <span
              className="type-b3-md font-semibold text-gray-900"
              data-testid={`assignment-live-analytics-${metric.key}`}
            >
              {formatMetric(liveAnalytics[metric.key])}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-end">
        <MasaiButton
          type="secondary"
          size="sm"
          ctaText="Refetch analytics"
          htmlType="button"
          disabled={refreshing}
          onClick={() => void handleRefetch()}
          data-testid="assignment-live-analytics-refetch"
        />
      </div>
    </div>
  )
}
