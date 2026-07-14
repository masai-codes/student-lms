'use client'

import { AssignmentDetailLayout } from '../shared/AssignmentDetailLayout'
import { AssignmentMainContent } from '../shared/AssignmentMainContent'

import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'

type PracticeAssignmentContentProps = {
  detail: AssignmentDetailPayload
}

export function PracticeAssignmentContent({
  detail,
}: PracticeAssignmentContentProps) {
  return (
    <AssignmentDetailLayout
      detail={detail}
      main={<AssignmentMainContent detail={detail} />}
    />
  )
}
