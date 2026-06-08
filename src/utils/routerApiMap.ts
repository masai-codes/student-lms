import { getRouteApi } from "@tanstack/react-router"

export const routeApiMap = {
  lectures_i: getRouteApi(
    "/(protected)/_layout/courses/$courseId/_courseTabLayout/lectures/"
  ),
  assignments_i: getRouteApi(
    "/(protected)/_layout/courses/$courseId/_courseTabLayout/assignments/"
  ),
  resources_i:  getRouteApi(
    "/(protected)/_layout/courses/$courseId/_courseTabLayout/resources/"
  ),
  announcements_o: getRouteApi(
    "/(protected)/_layout/announcements/"
  ),
  support_o: getRouteApi(
    "/(protected)/_layout/support/"
  ),
  discussions_a_i: getRouteApi(
    "/(protected)/_layout/courses/$courseId/assignments_/$assignmentId/discussions/"
  ),
  discussions_l_i: getRouteApi(
    "/(protected)/_layout/courses/$courseId/lectures_/$lectureId/discussions/"
  ),
  discussions: getRouteApi(
    "/(protected)/_layout/discussions/"
  )
} as const