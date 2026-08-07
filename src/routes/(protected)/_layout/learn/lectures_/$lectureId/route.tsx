import { createFileRoute } from '@tanstack/react-router'

import {
  LearnPageDetailError,
  LectureDetailPage,
} from '@/components/features/learn/LearnPageDetails'
import { fetchLectureLearningDetailFromApi } from '@/lib/api/learn/learnApi'

export const Route = createFileRoute(
  '/(protected)/_layout/learn/lectures_/$lectureId',
)({
  component: RouteComponent,
  errorComponent: LearnPageDetailError,
  loader: async ({ params }) => {
    const lectureId = Number(params.lectureId)
    if (!Number.isFinite(lectureId) || lectureId <= 0) {
      throw new Error('LEARN_DETAIL_NOT_FOUND')
    }
    return fetchLectureLearningDetailFromApi(lectureId)
  },
})

function RouteComponent() {
  const detail = Route.useLoaderData()

  return (
    <div className="w-full lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
      <LectureDetailPage detail={detail} />
    </div>
  )
}
