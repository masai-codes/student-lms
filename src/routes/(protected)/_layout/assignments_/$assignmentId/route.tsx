import { createFileRoute } from '@tanstack/react-router'

import {
  AssignmentDetailPage,
  LearnPageDetailError,
  LearningDetailMasaiBreadcrumb,
} from '@/components/features/learn/LearnPageDetails'
import { layoutMainClasses } from '@/lib/layout'
import { getAssignmentLearningDetail } from '@/server/learn/getAssignmentLearningDetail'

export const Route = createFileRoute('/(protected)/_layout/assignments_/$assignmentId')({
  component: RouteComponent,
  errorComponent: LearnPageDetailError,
  loader: async ({ params }) => {
    const assignmentId = Number(params.assignmentId)
    if (!Number.isFinite(assignmentId) || assignmentId <= 0) {
      throw new Error('LEARN_DETAIL_NOT_FOUND')
    }
    return getAssignmentLearningDetail({ data: { assignmentId } })
  },
})

function RouteComponent() {
  const detail = Route.useLoaderData()

  return (
    <div className={layoutMainClasses}>
      <LearningDetailMasaiBreadcrumb currentLabel={detail.title} />
      <AssignmentDetailPage detail={detail} />
    </div>
  )
}
