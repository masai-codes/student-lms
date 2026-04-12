import { Link, Outlet } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import {
  FileText,
  MessageCircle,
  Sparkles,
  Users,
} from "lucide-react"
import type { LectureType } from "@/server/lectures/fetchAllLectures"
import {
  VideoPlayer,
  VideoPlayerControlBar,
  VideoPlayerMuteButton,
  VideoPlayerPlayButton,
  VideoPlayerTimeDisplay,
  VideoPlayerTimeRange,
  VideoPlayerVolumeRange,
} from "@/components/ui/video-player"
import { Button } from "@/components/ui/button"
import { LectureDetailsHeader, SidePanel } from "@/components/features/courses"
import { fetchLectureTranscript } from "@/server/lectures/LectureDetailsButtons/fetchLectureTranscript"

type SidePanelType = "default" | "transcript" | "description" | "summary" | "chat"

type Props = {
  lecture: LectureType
  panel: SidePanelType
  setPanel: (panel: SidePanelType) => void
  courseId: string
}

export function LectureWithVideo({
  lecture,
  panel,
  setPanel,
  courseId,
}: Props) {

  const lectureId = JSON.stringify(lecture.id)

  const {
    data,
    // isLoading,
    // isError,
    refetch,
  } = useQuery({
    queryKey: ['lectureTranscript', lectureId],
    queryFn: () =>
      fetchLectureTranscript({
        data: { lectureId: lecture.id },
      }),
    enabled: false, 
  })

  const handleClickTranscript = () => {
    refetch()
  }


  return (
    <div className="w-full space-y-6 py-6">
      {/* Header */}
      <LectureDetailsHeader data={lecture} />

      {/* Main */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Video */}
        <VideoPlayer className="rounded-lg overflow-hidden border">
          <video
            slot="media"
            src={lecture.videos?.[0]}
            poster="https://image.mux.com/VZtzUzGRv02OhRnZCxcNg49OilvolTqdnFLEqBsTwaxU/thumbnail.webp?time=0"
            suppressHydrationWarning
          />
          <VideoPlayerControlBar>
            <VideoPlayerPlayButton />
            <VideoPlayerTimeRange />
            <VideoPlayerTimeDisplay showDuration />
            <VideoPlayerMuteButton />
            <VideoPlayerVolumeRange />
          </VideoPlayerControlBar>
        </VideoPlayer>

        {/* Side Panel */}
        <SidePanel panel={panel} onClose={() => setPanel("default")} />
      </div>

      {/* Bottom Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" className="border border-[#A4CAFE]" onClick={() => (handleClickTranscript(), setPanel("transcript"))}>
          <FileText className="h-4 w-4" />
          Transcript
        </Button>
        <Button variant="outline" className="border border-[#A4CAFE]" onClick={() => setPanel("description")}>
          <FileText className="h-4 w-4" />
          Description
        </Button>

        <Button variant="outline" className="border border-[#A4CAFE]" onClick={() => setPanel("summary")}>
          <Sparkles className="h-4 w-4" />
          AI Summary
        </Button>

        <Button variant="outline" onClick={() => setPanel("chat")}>
          <MessageCircle className="h-4 w-4 mr-2" />
          AI Chat
        </Button>

        <Link
          to="/courses/$courseId/lectures/$lectureId/discussions"
          params={{ courseId, lectureId }}
          search={{page: undefined, panel: undefined}}
        >
          <Button variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Discussions
          </Button>
        </Link>
      </div>

      <Outlet />
    </div>
  )
}
