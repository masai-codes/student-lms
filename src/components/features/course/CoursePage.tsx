import { useQuery } from '@tanstack/react-query'
import {
  fetchCoursePagePrimary,
  fetchCoursePageDetails,
} from '@/lib/api/course/courseApi'
import { CourseHeroCard } from './CourseHeroCard'
import { CourseTimeline } from './CourseTimeline'
import { CourseAgreements } from './CourseAgreements'
import { CourseResources } from './CourseResources'
import { CourseInstructors } from './CourseInstructors'
import { CourseEvaluations } from './CourseEvaluations'
import { CourseAttendance } from './CourseAttendance'
import { CourseCertificates } from './CourseCertificates'
import { CourseStructure } from './CourseStructure'
import { CoursePageSkeleton } from '@/components/skeleton/course/CoursePageSkeleton'

interface Props {
  batchId: string
}

export function CoursePage({ batchId }: Props) {
  const id = Number(batchId)

  const {
    data: primary,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['course-primary', id],
    queryFn: () => fetchCoursePagePrimary(id),
  })

  const { data: details } = useQuery({
    queryKey: ['course-details', id],
    queryFn: () => fetchCoursePageDetails(id),
    enabled: !!primary,
  })

  if (isLoading) return <CoursePageSkeleton />

  if (isError || !primary) {
    return (
      <div className="flex items-center justify-center min-h-96 text-foreground-muted text-sm">
        Course not found or you are not enrolled.
      </div>
    )
  }

  const { batchData, agreements } = primary
  const evaluations = details?.evaluations ?? []
  const certificates = details?.certificates ?? []
  const attendance = details?.attendance ?? null

  return (
    <div className="flex flex-col gap-6 px-2 py-4 max-w-[1280px] mx-auto">
      <CourseHeroCard data={batchData} />
      <CourseTimeline items={batchData.courseTimeline} />
      <CourseAgreements agreements={agreements} />
      <CourseResources resources={batchData.resources} />
      <CourseCertificates certificates={certificates} />
      <CourseInstructors groups={batchData.supportGroups} />
      {batchData.showEvaluationReport && (
        <CourseEvaluations evaluations={evaluations} />
      )}
      {batchData.showAttendanceReport && attendance && (
        <CourseAttendance data={attendance} />
      )}
      <CourseStructure modules={batchData.courseStructure} />
    </div>
  )
}
