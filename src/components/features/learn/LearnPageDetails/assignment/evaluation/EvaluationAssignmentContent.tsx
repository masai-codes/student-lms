'use client'

import { DuringEvaluationAssignment } from './DuringEvaluationAssignment'
import { AssignmentDetailLayout } from '../shared/AssignmentDetailLayout'
import { AssignmentPhaseContent } from '../shared/AssignmentPhaseContent'

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
    <AssignmentDetailLayout detail={detail} main={renderEvaluationMain(detail)} />
  )
}
