'use client'

import { EvaluationAssignmentContent } from './evaluation/EvaluationAssignmentContent'
import { PracticeAssignmentContent } from './practice/PracticeAssignmentContent'
import { RegularAssignmentContent } from './regular/RegularAssignmentContent'
import { useAutoCreateAssignmentSubmission } from './shared/useAutoCreateAssignmentSubmission'
import { useTokenCompletion } from './shared/useTokenCompletion'
import { LearnRestrictionPage } from '../common/ban/LearnBanNotice'

import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'

type AssignmentDetailPageProps = {
  detail: AssignmentDetailPayload
}

export function AssignmentDetailPage({ detail }: AssignmentDetailPageProps) {
  // Side-effect parity with the legacy LMS: auto-start the submission once the
  // window opens, and honour the Assess Platform return-token completion link.
  useAutoCreateAssignmentSubmission(detail)
  useTokenCompletion(detail.id)

  if (detail.restriction) {
    return <LearnRestrictionPage restriction={detail.restriction} />
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
