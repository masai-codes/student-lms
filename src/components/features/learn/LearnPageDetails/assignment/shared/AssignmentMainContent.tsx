'use client'

import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'

type AssignmentMainContentProps = {
  detail: AssignmentDetailPayload
}

/**
 * Main panel of the assignment detail page. Matches the old LMS: the panel is
 * the Instructions area only — there is no phase headline. When instructions
 * exist they render in the layout's Instructions section (mainFooter); when
 * they don't, we show the empty-instructions message here instead.
 */
export function AssignmentMainContent({ detail }: AssignmentMainContentProps) {
  if (detail.instructions) return null

  return (
    <section
      data-testid="assignment-empty-instructions"
      className="flex min-h-[200px] flex-col items-center justify-center md:min-h-[320px]"
    >
      <p className="type-b2-regular max-w-md text-center text-foreground-muted">
        {detail.emptyInstructionsMessage}
      </p>
    </section>
  )
}
