'use client'

import { DuringPracticeAssignment } from './DuringPracticeAssignment'
import { AssignmentDetailLayout } from '../shared/AssignmentDetailLayout'
import { AssignmentPhaseContent } from '../shared/AssignmentPhaseContent'

import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'

type PracticeAssignmentContentProps = {
  detail: AssignmentDetailPayload
}

function renderPracticeMain(detail: AssignmentDetailPayload) {
  if (detail.phase === 'during') {
    return <DuringPracticeAssignment content={detail.phaseContent} />
  }
  return <AssignmentPhaseContent content={detail.phaseContent} />
}

export function PracticeAssignmentContent({ detail }: PracticeAssignmentContentProps) {
  return (
    <AssignmentDetailLayout detail={detail} main={renderPracticeMain(detail)} />
  )
}
