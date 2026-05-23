'use client'

import { AfterRegularAssignment } from './AfterRegularAssignment'
import { BeforeRegularAssignment } from './BeforeRegularAssignment'
import { DuringRegularAssignment } from './DuringRegularAssignment'
import { AssignmentDetailLayout } from '../shared/AssignmentDetailLayout'

import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'

type RegularAssignmentContentProps = {
  detail: AssignmentDetailPayload
}

function renderRegularMain(detail: AssignmentDetailPayload) {
  switch (detail.phase) {
    case 'before':
      return <BeforeRegularAssignment schedule={detail.schedule} />
    case 'during':
      return <DuringRegularAssignment schedule={detail.schedule} />
    case 'after':
      return <AfterRegularAssignment schedule={detail.schedule} />
    default:
      return <BeforeRegularAssignment schedule={detail.schedule} />
  }
}

export function RegularAssignmentContent({ detail }: RegularAssignmentContentProps) {
  return (
    <AssignmentDetailLayout detail={detail} main={renderRegularMain(detail)} />
  )
}
