import { Link, getRouteApi, useMatchRoute } from "@tanstack/react-router"
import { BookOpen, FileText, Play } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TabGroup() {
  const { useParams } = getRouteApi(
    "/(protected)/_layout/courses/$courseId/_courseTabLayout"
  )
  const { courseId } = useParams()
  const matchRoute = useMatchRoute()

  const activeTab =
    matchRoute({
      to: "/courses/$courseId/lectures",
      params: { courseId },
      fuzzy: true,
    })
      ? "lectures"
      : matchRoute({
          to: "/courses/$courseId/assignments",
          params: { courseId },
          fuzzy: true,
        })
      ? "assignments"
      : matchRoute({
          to: "/courses/$courseId/resources",
          params: { courseId },
          fuzzy: true,
        })
      ? "resources"
      : "overview"

  return (
    <Tabs value={activeTab} className="w-fit">
      <TabsList className="bg-transparent gap-4">
        {/* Lectures */}
        <TabsTrigger
          value="lectures"
          asChild
          className="
            rounded-sm border p-4 flex items-center gap-3
            data-[state=active]:border-[#6D67E4]
            data-[state=active]:bg-[#F4F3FF]
            data-[state=active]:text-[#6D67E4]
            border-[] border-2
          "
        >
          <Link
            to="/courses/$courseId/lectures"
            params={{ courseId }}
            search={{ page: undefined }}
          >
            <Play size={20} />
            <span className="font-medium">Lectures</span>
          </Link>
        </TabsTrigger>

        {/* Assignments */}
        <TabsTrigger
          value="assignments"
          asChild
          className="
            rounded-sm border p-4 flex items-center gap-3
            data-[state=active]:border-[#6D67E4]
            data-[state=active]:bg-[#F4F3FF]
            data-[state=active]:text-[#6D67E4]
            border-[] border-2
          "
        >
          <Link
            to="/courses/$courseId/assignments"
            params={{ courseId }}
            search={{ page: undefined }}
          >
            <FileText size={20} />
            <span className="font-medium">Assignments</span>
          </Link>
        </TabsTrigger>

        {/* Resources */}
        <TabsTrigger
          value="resources"
          asChild
          className="
            rounded-sm border p-4 flex items-center gap-3
            data-[state=active]:border-[#6D67E4]
            data-[state=active]:bg-[#F4F3FF]
            data-[state=active]:text-[#6D67E4]
            border-[] border-2
          "
        >
          <Link
            to="/courses/$courseId/resources"
            params={{ courseId }}
            search={{ page: undefined }}
          >
            <BookOpen size={20} />
            <span className="font-medium">Resources</span>
          </Link>
        </TabsTrigger>

      </TabsList>
    </Tabs>
  )
}
