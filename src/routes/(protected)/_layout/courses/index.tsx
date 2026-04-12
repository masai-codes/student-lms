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
      <div className="w-full py-8">
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
    <section className="w-full py-2">
      <h2 className="mb-4 text-2xl font-bold">My Courses</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {coursesList.map((course, key) => (
          <CourseCard key={key} course={course} />
        ))}
      </div>
    </section>
  )
}
