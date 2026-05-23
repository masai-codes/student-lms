'use client'

import { AfterEvaluationAssignment } from './AfterEvaluationAssignment'
import { BeforeEvaluationAssignment } from './BeforeEvaluationAssignment'
import { DuringEvaluationAssignment } from './DuringEvaluationAssignment'
import { AssignmentDetailLayout } from '../shared/AssignmentDetailLayout'

import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'

type EvaluationAssignmentContentProps = {
  detail: AssignmentDetailPayload
}

function renderEvaluationMain(detail: AssignmentDetailPayload) {
  switch (detail.phase) {
    case 'before':
      return <BeforeEvaluationAssignment schedule={detail.schedule} />
    case 'during':
      return <DuringEvaluationAssignment schedule={detail.schedule} />
    case 'after':
      return <AfterEvaluationAssignment schedule={detail.schedule} />
    default:
      return <BeforeEvaluationAssignment schedule={detail.schedule} />
  }
}

export function EvaluationAssignmentContent({
  detail,
}: EvaluationAssignmentContentProps) {
  return (
    <AssignmentDetailLayout detail={detail} main={renderEvaluationMain(detail)} />
  )
}
