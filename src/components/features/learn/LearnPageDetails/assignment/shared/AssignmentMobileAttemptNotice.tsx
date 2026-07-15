'use client'

import { Laptop } from '@phosphor-icons/react'

import type { AssignmentDetailFooter } from '@/server/learn/assignmentDetailFooterTypes'

/**
 * Mobile-only notice telling the learner to switch to a laptop/desktop to
 * attempt the assignment. Mirrors the old LMS behaviour: on mobile the sticky
 * action footer is hidden, and this banner is shown in its place. Only rendered
 * when the footer actually has actions that are being hidden.
 */
export function AssignmentMobileAttemptNotice({
  footer,
}: {
  footer: AssignmentDetailFooter
}) {
  if (!footer.visible || footer.actions.length === 0) {
    return null
  }

  return (
    <div
      className="flex items-center gap-3 rounded-xl bg-info px-6 py-2.5 md:hidden"
      data-testid="assignment-mobile-attempt-notice"
    >
      <div className="rounded-full bg-surface p-2">
        <Laptop size={24} className="text-info" />
      </div>
      <p className="type-b3-md font-medium text-info-foreground">
        Please open the assignment on a laptop or desktop to attempt
      </p>
    </div>
  )
}
