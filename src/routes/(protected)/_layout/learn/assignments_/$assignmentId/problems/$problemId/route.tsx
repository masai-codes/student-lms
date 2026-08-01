import { createFileRoute } from '@tanstack/react-router'

import {
  LearnPageDetailError,
  LearningDetailMasaiBreadcrumb,
  ProblemDetailPage,
} from '@/components/features/learn/LearnPageDetails'
import { fetchProblemDetailFromApi } from '@/lib/api/learn/learnApi'

export const Route = createFileRoute(
  '/(protected)/_layout/learn/assignments_/$assignmentId/problems/$problemId',
)({
  component: RouteComponent,
  errorComponent: LearnPageDetailError,
  loader: async ({ params }) => {
    const assignmentId = Number(params.assignmentId)
    const problemId = Number(params.problemId)
    if (
      !Number.isFinite(assignmentId) ||
      assignmentId <= 0 ||
      !Number.isFinite(problemId) ||
      problemId <= 0
    ) {
      throw new Error('LEARN_DETAIL_NOT_FOUND')
    }
    return fetchProblemDetailFromApi(assignmentId, problemId)
  },
})

function RouteComponent() {
  const detail = Route.useLoaderData()

  return (
    <div className="layout-page">
      <LearningDetailMasaiBreadcrumb currentLabel={detail.problemTitle} />
      <ProblemDetailPage detail={detail} />
    </div>
  )
}
