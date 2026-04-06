import { useQuery } from "@tanstack/react-query"
import { ChevronRight } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { CourseCard } from "@/components/features/courses"
import { fetchAllCourses } from "@/server/courses/fetchCourses"

type SwitchCourseProps = {
  userId: number
}

export default function SwitchCourse({ userId }: SwitchCourseProps) {
  const { data: coursesList } = useQuery({
    queryKey: ["switch-courses", userId],
    queryFn: () =>
      fetchAllCourses({
        data: { userId },
      }),
    enabled: !!userId,
  })

  return (
    <Sheet defaultOpen>
      <SheetContent
        side="right"
        className="top-4 right-4 bottom-4 w-full max-w-[580px] rounded-2xl border bg-white px-6 py-6 shadow-2xl sm:px-8"
      >
        <SheetHeader className="mb-6 px-1">
          <SheetTitle className="text-xl font-semibold">
            Select a course
          </SheetTitle>
        </SheetHeader>
        <div className="mt-2 flex flex-col gap-3">
          {coursesList?.map((course, idx) => (
            <div
              key={idx}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-4 hover:bg-slate-50"
            >
              <div className="flex-1">
                <CourseCard course={course} />
              </div>
              <ChevronRight className="ml-4 h-5 w-5 text-slate-400" />
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}