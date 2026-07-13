'use client'

import { AssignmentDetailLayout } from '../shared/AssignmentDetailLayout'
import { AssignmentMainContent } from '../shared/AssignmentMainContent'

import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'

type RegularAssignmentContentProps = {
  detail: AssignmentDetailPayload
}

export function RegularAssignmentContent({ detail }: RegularAssignmentContentProps) {
  return (
    <AssignmentDetailLayout
      detail={detail}
      main={<AssignmentMainContent detail={detail} />}
    />
  )
}
