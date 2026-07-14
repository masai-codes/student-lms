'use client'

import { AssignmentDetailLayout } from '../shared/AssignmentDetailLayout'
import { AssignmentMainContent } from '../shared/AssignmentMainContent'
import { AssignmentPledgeModal } from '../shared/AssignmentPledgeModal'

import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'

type EvaluationAssignmentContentProps = {
  detail: AssignmentDetailPayload
}

export function EvaluationAssignmentContent({
  detail,
}: EvaluationAssignmentContentProps) {
  return (
    <>
      <AssignmentDetailLayout
        detail={detail}
        main={<AssignmentMainContent detail={detail} />}
      />
      {/* The pledge is an overlay over the assignment content (not a content
          replacement), matching the legacy LMS: confirming creates the
          submission, after which requiresPledge flips false and it disappears. */}
      {detail.requiresPledge ? (
        <AssignmentPledgeModal assignmentId={detail.id} />
      ) : null}
    </>
  )
}
