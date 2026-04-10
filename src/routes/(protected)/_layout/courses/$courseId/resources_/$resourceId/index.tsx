import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { ResourceDetails } from '@/components/features/courses'

const parentRoute = getRouteApi(
  '/(protected)/_layout/courses/$courseId/resources_/$resourceId'
)

export const Route = createFileRoute(
  '/(protected)/_layout/courses/$courseId/resources_/$resourceId/',
)({
  component: RouteComponent,
})

function RouteComponent() {

    const { resourceData } = parentRoute.useLoaderData()

  return (
      <ResourceDetails data={resourceData[0]}/>
  )
}
