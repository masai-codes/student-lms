'use client'

import { CheckCircle } from '@phosphor-icons/react'

import type { AssignmentCompletedDetails } from '@/server/learn/utils/buildAssignmentCompletedDetails'

type AssignmentCompletedBannerProps = {
  completedDetails: AssignmentCompletedDetails | null
}

/** "Completed on …" banner (auto-graded or manually marked) for the detail body. */
export function AssignmentCompletedBanner({
  completedDetails,
}: AssignmentCompletedBannerProps) {
  if (completedDetails == null) {
    return null
  }

  return (
    <div
      className="flex items-start gap-2 rounded-lg bg-[#EDEBFE] p-3"
      data-testid="assignment-completed-banner"
      data-variant={completedDetails.variant}
    >
      <CheckCircle
        className="mt-0.5 size-5 shrink-0 text-[#6962AC]"
        weight="fill"
        aria-hidden
      />
      <p className="type-b3-md text-gray-900">{completedDetails.message}</p>
    </div>
  )
}
