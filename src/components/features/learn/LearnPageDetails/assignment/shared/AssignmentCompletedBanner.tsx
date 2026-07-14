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
      className="flex items-start gap-2 rounded-lg bg-gradient-to-r from-[#EDEBFE] to-[#EDEBFE]/60 p-3 dark:bg-none dark:bg-brand-subtle"
      data-testid="assignment-completed-banner"
      data-variant={completedDetails.variant}
    >
      <CheckCircle
        className="animate-dash-pop mt-0.5 size-5 shrink-0 text-brand"
        weight="fill"
        aria-hidden
      />
      <p className="type-b3-md text-foreground">{completedDetails.message}</p>
    </div>
  )
}
