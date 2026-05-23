'use client'

import { AfterPracticeAssignment } from './AfterPracticeAssignment'
import { BeforePracticeAssignment } from './BeforePracticeAssignment'
import { DuringPracticeAssignment } from './DuringPracticeAssignment'
import { AssignmentDetailLayout } from '../shared/AssignmentDetailLayout'

import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'

type PracticeAssignmentContentProps = {
  detail: AssignmentDetailPayload
}

function renderPracticeMain(detail: AssignmentDetailPayload) {
  switch (detail.phase) {
    case 'before':
      return <BeforePracticeAssignment schedule={detail.schedule} />
    case 'during':
      return <DuringPracticeAssignment schedule={detail.schedule} />
    case 'after':
      return <AfterPracticeAssignment schedule={detail.schedule} />
    default:
      return <BeforePracticeAssignment schedule={detail.schedule} />
  }
}

export function PracticeAssignmentContent({ detail }: PracticeAssignmentContentProps) {
  return (
    <AssignmentDetailLayout detail={detail} main={renderPracticeMain(detail)} />
  )
}
