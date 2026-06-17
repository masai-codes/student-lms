import { fetchJson } from '@/lib/api/fetchJson'
import { COURSE_API } from './coursePaths'
import type { CourseBatchData } from '@/server/api/course/getCourseBatchData.service'
import type { CourseAgreementItem } from '@/server/api/course/getCourseAgreements.service'
import type { CourseAttendanceData } from '@/server/api/course/getCourseAttendance.service'
import type { CourseEvaluationItem } from '@/server/api/course/getCourseEvaluations.service'
import type { CertificateItem } from '@/server/api/course/getCourseCertificates.service'

export interface CoursePagePrimary {
  batchData: CourseBatchData
  agreements: CourseAgreementItem[]
}

export interface CoursePageDetails {
  evaluations: CourseEvaluationItem[]
  attendance: CourseAttendanceData | null
  certificates: CertificateItem[]
}

export async function fetchCoursePagePrimary(batchId: number): Promise<CoursePagePrimary> {
  return fetchJson<CoursePagePrimary>(COURSE_API.primary(batchId))
}

export async function fetchCoursePageDetails(batchId: number): Promise<CoursePageDetails> {
  return fetchJson<CoursePageDetails>(COURSE_API.details(batchId))
}
