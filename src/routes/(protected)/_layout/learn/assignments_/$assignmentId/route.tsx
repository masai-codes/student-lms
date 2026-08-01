import { createFileRoute } from '@tanstack/react-router'

import {
  AssignmentDetailPage,
  LearnPageDetailError,
  LearningDetailMasaiBreadcrumb,
} from '@/components/features/learn/LearnPageDetails'
import { detailRouteInnerClasses } from '@/lib/layout'
import { fetchAssignmentLearningDetailFromApi } from '@/lib/api/learn/learnApi'

export const Route = createFileRoute(
  '/(protected)/_layout/learn/assignments_/$assignmentId',
)({
  component: RouteComponent,
  errorComponent: LearnPageDetailError,
  loader: async ({ params }) => {
    const assignmentId = Number(params.assignmentId)
    if (!Number.isFinite(assignmentId) || assignmentId <= 0) {
      throw new Error('LEARN_DETAIL_NOT_FOUND')
    }
    return fetchAssignmentLearningDetailFromApi(assignmentId)
  },
})

function RouteComponent() {
  const detail = Route.useLoaderData()

  return (
    <div className={detailRouteInnerClasses}>
      <LearningDetailMasaiBreadcrumb currentLabel={detail.title} />
      <AssignmentDetailPage detail={detail} />
    </div>
  )
}
