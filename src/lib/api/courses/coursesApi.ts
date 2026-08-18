import { fetchJson } from '@/lib/api/fetchJson'
import { MY_COURSES_API } from './coursesPaths'
import type { MyCoursesData } from '@/server/api/courses/getMyCourses.service'

export async function fetchMyCourses(): Promise<MyCoursesData> {
  return fetchJson<MyCoursesData>(MY_COURSES_API.list())
}
