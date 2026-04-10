import { createFileRoute, getRouteApi } from "@tanstack/react-router"
import { fetchLecturesById } from "@/server/lectures/fetchLecturesById"
import { LectureWithJoinCTA } from "@/components/features/courses"
import { LectureYetToStart } from "@/components/features/courses"
import { LectureWithVideo } from "@/components/features/courses"
import { LectureWithNoVideo } from "@/components/features/courses"
import { getCurrentTime } from "@/utils/generics"

type SidePanel = "default" | "transcript" | "description" | "summary" | "chat"

export const Route = createFileRoute(
  '/(protected)/_layout/courses/$courseId/lectures_/$lectureId',
)({
  validateSearch: (search) => {
    const isValidPanel =
      typeof search.panel === 'string' &&
      ['default', 'transcript', 'description', 'summary', 'chat'].includes(
        search.panel,
      )

    return {
      panel: isValidPanel ? (search.panel as SidePanel) : undefined,
    }
  },
  component: RouteComponent,
  loader: async ({ params }) => {
    const lectureId = Number(params.lectureId)

    const lectureData = await fetchLecturesById({
      data: { lectureId },
    })
    const { iso } = await getCurrentTime()

    return { iso, lectureData }
  }

})

function RouteComponent() {

  const { panel: searchPanel } = Route.useSearch()
  const navigate = Route.useNavigate()

  const { useParams } = getRouteApi('/(protected)/_layout/courses/$courseId/lectures_/$lectureId')

  const { courseId, lectureId } = useParams()

  const panel = (searchPanel ?? 'default')

  const setPanel = (nextPanel: SidePanel) => {
    navigate({
      search: (prev) => ({
        ...prev,
        panel: nextPanel === 'default' ? undefined : nextPanel,
      }),
    })
  }

  const data = Route.useLoaderData();

  const { lectureData, iso } = data;

  if (!lectureData[0]?.schedule || !lectureData[0]?.concludes) {
    return <LectureYetToStart lecture={lectureData[0]}/>
  }

  const now = new Date(iso).getTime()
  const start = new Date(lectureData[0].schedule).getTime()
  const end = new Date(lectureData[0].concludes).getTime()

  const fiveMinutes = 5 * 60 * 1000

  // 🔒 More than 5 mins before start
  if (now < start - fiveMinutes) {
    return <LectureYetToStart lecture={lectureData[0]}/>
  }

  // 🎥 Within 5 mins before start until conclude
  if (now >= start - fiveMinutes && now <= end) {
    return <LectureWithJoinCTA lecture={lectureData[0]}/>
  }

  // 📺 After conclude
  if (now > end) {
    if (lectureData[0].videos?.[0]) {
      console.log(lectureData[0].videos[0])
      return (
        <LectureWithVideo
          lecture={lectureData[0]}
          panel={panel}
          setPanel={setPanel}
          courseId={courseId}
        />
      )
    }

    return (
      <LectureWithNoVideo
        lecture={lectureData[0]}
        panel={panel}
        setPanel={setPanel}
        courseId={courseId}
      />
    )
  }

  return null
}
