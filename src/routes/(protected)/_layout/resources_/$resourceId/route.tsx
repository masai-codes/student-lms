import { createFileRoute } from '@tanstack/react-router'

import {
  LearnPageDetailError,
  LearningDetailMasaiBreadcrumb,
  ResourceDetailPage,
} from '@/components/features/learn/LearnPageDetails'
import { detailRouteInnerClasses } from '@/lib/layout'
import { fetchResourceLearningDetailFromApi } from '@/lib/api/learn/learnApi'

export const Route = createFileRoute(
  '/(protected)/_layout/resources_/$resourceId',
)({
  component: RouteComponent,
  errorComponent: LearnPageDetailError,
  loader: async ({ params }) => {
    const resourceId = Number(params.resourceId)
    if (!Number.isFinite(resourceId) || resourceId <= 0) {
      throw new Error('LEARN_DETAIL_NOT_FOUND')
    }
    return fetchResourceLearningDetailFromApi(resourceId)
  },
})

function RouteComponent() {
  const detail = Route.useLoaderData()

  return (
    <div className={detailRouteInnerClasses}>
      <LearningDetailMasaiBreadcrumb currentLabel={detail.title} />
      <ResourceDetailPage detail={detail} />
    </div>
  )
}
