import { createFileRoute } from '@tanstack/react-router'

import {
  LearnPageDetailError,
  LectureDetailPage,
} from '@/components/features/learn/LearnPageDetails'
import { lectureDetailRouteClasses } from '@/lib/layout'
import { getLectureLearningDetail } from '@/server/learn/getLectureLearningDetail'

export const Route = createFileRoute('/(protected)/_layout/lectures_/$lectureId')({
  component: RouteComponent,
  errorComponent: LearnPageDetailError,
  loader: async ({ params }) => {
    const lectureId = Number(params.lectureId)
    if (!Number.isFinite(lectureId) || lectureId <= 0) {
      throw new Error('LEARN_DETAIL_NOT_FOUND')
    }
    return getLectureLearningDetail({ data: { lectureId } })
  },
})

function RouteComponent() {
  const detail = Route.useLoaderData()

  return (
    <div className={lectureDetailRouteClasses}>
      <LectureDetailPage detail={detail} />
    </div>
  )
}
