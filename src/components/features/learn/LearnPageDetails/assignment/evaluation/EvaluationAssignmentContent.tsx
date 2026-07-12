'use client'

import { AssignmentDetailLayout } from '../shared/AssignmentDetailLayout'
import { AssignmentPhaseContent } from '../shared/AssignmentPhaseContent'
import { AssignmentPledgeModal } from '../shared/AssignmentPledgeModal'
import { DuringEvaluationAssignment } from './DuringEvaluationAssignment'

import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'

type EvaluationAssignmentContentProps = {
  detail: AssignmentDetailPayload
}

function renderEvaluationMain(detail: AssignmentDetailPayload) {
  if (detail.phase === 'during') {
    return <DuringEvaluationAssignment content={detail.phaseContent} />
  }
  return <AssignmentPhaseContent content={detail.phaseContent} />
}

export function EvaluationAssignmentContent({ detail }: EvaluationAssignmentContentProps) {
  return (
    <>
      <AssignmentDetailLayout detail={detail} main={renderEvaluationMain(detail)} />
      {/* The pledge is an overlay over the assignment content (not a content
          replacement), matching the legacy LMS: confirming creates the
          submission, after which requiresPledge flips false and it disappears. */}
      {detail.requiresPledge ? <AssignmentPledgeModal assignmentId={detail.id} /> : null}
    </>
  )
}
