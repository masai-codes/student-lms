import { createFileRoute } from "@tanstack/react-router"
import { CourseCard } from "@/components/features/courses"
import { CourseSkeletonCard as CourseCardSkeleton } from "@/components/features/courses"
import { fetchAllCourses } from "@/server/courses/fetchCourses"


export const Route = createFileRoute('/(protected)/_layout/courses/')({
  beforeLoad: () => {
    const nn = 8
    return { nn }
  },
  pendingComponent: () => {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  },
  component: CoursesRoute,
  loader: async ({ context }) => {
    const { user, nn } = context
    console.log("Context for child 👾", nn)
    const coursesList = await fetchAllCourses({
      data: { userId: user.id },
    })

    return { coursesList }
  }
})

function CoursesRoute() {

  const { coursesList } = Route.useLoaderData()

  return (
    <section className="bg-[#FAF9F9] min-h-screen py-8 mx-[clamp(16px,6.25vw,80px)]">
      <div className="px-4">
        <h2 className="text-2xl font-bold mb-4">My Courses</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {coursesList.map((course, key) => (
            <CourseCard key={key} course={course} />
          ))}
        </div>
      </div>
    </section>
  )
}
