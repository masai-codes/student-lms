'use client'

import { DuringRegularAssignment } from './DuringRegularAssignment'
import { AssignmentDetailLayout } from '../shared/AssignmentDetailLayout'
import { AssignmentPhaseContent } from '../shared/AssignmentPhaseContent'

import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'

type RegularAssignmentContentProps = {
  detail: AssignmentDetailPayload
}

function renderRegularMain(detail: AssignmentDetailPayload) {
  if (detail.phase === 'during') {
    return <DuringRegularAssignment content={detail.phaseContent} />
  }
  return <AssignmentPhaseContent content={detail.phaseContent} />
}

export function RegularAssignmentContent({ detail }: RegularAssignmentContentProps) {
  return (
    <AssignmentDetailLayout detail={detail} main={renderRegularMain(detail)} />
  )
}
