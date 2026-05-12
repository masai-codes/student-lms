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
  announcements_i: getRouteApi(
    "/(protected)/_layout/courses/$courseId/_courseTabLayout/announcements/"
  ),
  lectures_o: getRouteApi(
    "/(protected)/_layout/lectures/"
  ),
  assignments_o: getRouteApi(
    "/(protected)/_layout/assignments/"
  ),
  resources_o:  getRouteApi(
    "/(protected)/_layout/resources/"
  ),
  announcements_o: getRouteApi(
    "/(protected)/_layout/announcements/"
  ),
  support_o: getRouteApi(
    '/(protected)/_layout/support/'
  ),
  bookmark: getRouteApi('/(protected)/_layout/bookmark/'),
} as const