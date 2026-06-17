import { fetchJson } from '@/lib/api/fetchJson'
import type { MyCoursesItem } from '@/server/api/my-courses/getMyLectures.service'

export async function fetchMyCourses(): Promise<MyCoursesItem[]> {
  return fetchJson<MyCoursesItem[]>('/api/my-courses')
}
