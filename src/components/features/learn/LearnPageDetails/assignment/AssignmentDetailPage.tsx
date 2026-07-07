'use client'

import { EvaluationAssignmentContent } from './evaluation/EvaluationAssignmentContent'
import { PracticeAssignmentContent } from './practice/PracticeAssignmentContent'
import { RegularAssignmentContent } from './regular/RegularAssignmentContent'
import { LearnBanPage } from '../common/ban/LearnBanNotice'

import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'

type AssignmentDetailPageProps = {
  detail: AssignmentDetailPayload
}

export function AssignmentDetailPage({ detail }: AssignmentDetailPageProps) {
  if (detail.banRestriction?.kind === 'page') {
    return <LearnBanPage />
  }

  switch (detail.assignmentKind) {
    case 'practice':
      return <PracticeAssignmentContent detail={detail} />
    case 'assignment':
      return <RegularAssignmentContent detail={detail} />
    case 'evaluation':
      return <EvaluationAssignmentContent detail={detail} />
  }
}
