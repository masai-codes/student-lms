import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { fetchMyCourses } from '@/lib/api/my-courses/myCoursesApi'
import { MyCoursesPageSkeleton } from '@/components/skeleton/my-courses/MyCoursesPageSkeleton'
import type { MyCoursesItem } from '@/server/api/my-courses/getMyLectures.service'
import { getAuthBranding } from '@/utils/authBranding'
import { getPortal } from '@/utils/portal'

function CourseCard({ course }: { course: MyCoursesItem }) {
  const navigate = useNavigate()
  const hasStarted = course.courseProgress > 0

  return (
    <div
      className="relative bg-surface rounded-2xl overflow-hidden border border-border"
      style={{ minHeight: 294 }}
    >
      {/* Logo */}
      <div
        className="absolute"
        style={{ left: 16, top: 16, height: 56, maxWidth: 120 }}
      >
        {course.courseLogo ? (
          <img
            src={course.courseLogo}
            alt={course.courseTitle}
            className="h-full w-auto object-contain"
          />
        ) : (
          <img
            src={getAuthBranding(getPortal()).logoSrc}
            alt={getAuthBranding(getPortal()).logoAlt}
            className="h-full w-auto object-contain"
          />
        )}
      </div>

      {/* Title + Institute */}
      <div className="absolute" style={{ left: 16, right: 16, top: 84 }}>
        <h3
          className="text-foreground leading-7"
          style={{ fontWeight: 600, fontSize: 18, lineHeight: '28px' }}
        >
          {course.courseTitle}
        </h3>
        {course.instituteName && (
          <p
            className="mt-1.5 text-foreground-muted"
            style={{
              fontWeight: 500,
              fontSize: 14,
              lineHeight: '20px',
            }}
          >
            By {course.instituteName}
          </p>
        )}
      </div>

      {/* Progress */}
      <div
        className="absolute flex flex-col gap-1.5"
        style={{ left: 16, right: 16, top: 182 }}
      >
        <div className="relative h-2.5 rounded-full bg-success-subtle">
          <div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{
              width: `${course.courseProgress}%`,
              background: '#31C48D',
            }}
          />
        </div>
        <div className="flex justify-between">
          <span
            className="text-foreground-muted"
            style={{
              fontWeight: 500,
              fontSize: 12,
              lineHeight: '16px',
            }}
          >
            Course Progress
          </span>
          <span
            className="text-foreground"
            style={{
              fontWeight: 500,
              fontSize: 12,
              lineHeight: '16px',
            }}
          >
            {course.courseProgress}%
          </span>
        </div>
      </div>

      {/* CTA */}
      <div
        className="absolute flex items-center gap-4"
        style={{ right: 16, bottom: 16 }}
      >
        <button
          onClick={() =>
            navigate({
              to: '/course/$batchId',
              params: { batchId: String(course.batchId) },
            })
          }
          className="cursor-pointer hover:underline text-brand"
          style={{
            fontWeight: 500,
            fontSize: 14,
            lineHeight: '20px',
            background: 'none',
            border: 'none',
            padding: 0,
          }}
        >
          Course Details
        </button>
        <button
          onClick={() =>
            navigate({
              to: '/course/$batchId',
              params: { batchId: String(course.batchId) },
            })
          }
          className="flex items-center justify-center rounded-lg cursor-pointer bg-brand text-brand-foreground"
          style={{
            fontWeight: 500,
            fontSize: 14,
            lineHeight: '20px',
            padding: '10px 16px',
            height: 40,
            width: 154,
          }}
        >
          {hasStarted ? 'Resume Learning' : 'Start Learning'}
        </button>
      </div>
    </div>
  )
}

export function MyCoursesPage() {
  const {
    data: courses = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['my-courses'],
    queryFn: fetchMyCourses,
  })

  if (isLoading) return <MyCoursesPageSkeleton />

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-96 text-foreground-muted text-sm">
        Failed to load courses.
      </div>
    )
  }

  return (
    <div
      className="flex flex-col gap-4 px-2 py-2 bg-surface-muted"
      style={{ minHeight: '100vh' }}
    >
      <h1
        className="text-foreground"
        style={{
          fontWeight: 700,
          fontSize: 20,
          lineHeight: '30px',
        }}
      >
        My Courses
      </h1>
      {courses.length === 0 ? (
        <p className="text-sm text-foreground-muted">No courses found.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {courses.map((course) => (
            <CourseCard key={course.batchId} course={course} />
          ))}
        </div>
      )}
    </div>
  )
}
