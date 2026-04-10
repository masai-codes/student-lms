import { Link, Outlet } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import {
  FileText,
  MessageCircle,
  Sparkles,
  Users,
} from "lucide-react"

import type { LectureType } from "@/server/lectures/fetchAllLectures"

import { Button } from "@/components/ui/button"
import { LectureDetailsHeader, SidePanel } from "@/components/features/courses"
import { fetchLectureTranscript } from "@/server/lectures/LectureDetailsButtons/fetchLectureTranscript"
import { fetchLectureDescription } from "@/server/lectures/LectureDetailsButtons/fetchLectureDescription"
import { fetchLectureAISummary } from "@/server/lectures/LectureDetailsButtons/fetchLectureAISummary"

type SidePanelType = "default" | "transcript" | "description" | "summary" | "chat"

type LectureWithNoVideoProps = {
  lecture: LectureType
  panel: SidePanelType
  setPanel: (panel: SidePanelType) => void
  courseId: string
}

export function LectureWithNoVideo({
  lecture,
  panel,
  setPanel,
  courseId,
}: LectureWithNoVideoProps) {

  const lectureId = JSON.stringify(lecture.id)

  const transcriptQuery = useQuery({
    queryKey: ["lectureTranscript", lectureId],
    queryFn: () =>
      fetchLectureTranscript({
        data: { lectureId: lecture.id },
      }),
    enabled: false,
  })

  const descriptionQuery = useQuery({
    queryKey: ["lectureDescription", lectureId],
    queryFn: () =>
      fetchLectureDescription({
        data: { lectureId: lecture.id },
      }),
    enabled: false,
  })

  const summaryQuery = useQuery({
    queryKey: ["lectureAISummary", lectureId],
    queryFn: () =>
      fetchLectureAISummary({
        data: { lectureId: lecture.id },
      }),
    enabled: false,
  })

  const handleClickTranscript = () => {
    setPanel("transcript")
    transcriptQuery.refetch()
  }

  const handleClickDescription = () => {
    setPanel("description")
    descriptionQuery.refetch()
  }

  const handleClickSummary = () => {
    setPanel("summary")
    summaryQuery.refetch()
  }


  return (
    <div className="py-6 space-y-6 mx-[clamp(16px,6.25vw,80px)]">
      {/* Header */}
      <LectureDetailsHeader data={lecture} />

      {/* Main */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 h-[560px]">

        <div className="bg-black rounded-xl flex flex-col justify-center items-center h-full">
          <img src="/VideoPlayer.svg" alt="video-player" className="h-24 w-24" />
          <p className="text-white text-xl">
            Lecture recording isn't available yet
          </p>
        </div>

        {/* Side Panel */}
        <div className="h-full">
          <SidePanel
            panel={panel}
            onClose={() => setPanel("default")}
            panelQueries={{
              transcript: {
                data: transcriptQuery.data,
                isLoading: transcriptQuery.isLoading,
                isError: transcriptQuery.isError,
              },
              description: {
                data: descriptionQuery.data,
                isLoading: descriptionQuery.isLoading,
                isError: descriptionQuery.isError,
              },
              summary: {
                data: summaryQuery.data,
                isLoading: summaryQuery.isLoading,
                isError: summaryQuery.isError,
              },
            }}
          />
        </div>

      </div>



      {/* Bottom Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          className="border border-[#A4CAFE]"
          onClick={handleClickTranscript}
        >
          <FileText className="h-4 w-4" />
          Transcript
        </Button>
        <Button
          variant="outline"
          className="border border-[#A4CAFE]"
          onClick={handleClickDescription}
        >
          <FileText className="h-4 w-4" />
          Description
        </Button>

        <Button
          variant="outline"
          className="border border-[#A4CAFE]"
          onClick={handleClickSummary}
        >
          <Sparkles className="h-4 w-4" />
          AI Summary
        </Button>

        <Button variant="outline" className="border border-[#A4CAFE]" onClick={() => setPanel("chat")}>
          <MessageCircle className="h-4 w-4" />
          AI Chat
        </Button>

        <Link
          to="/courses/$courseId/lectures/$lectureId/discussions"
          params={{ courseId, lectureId }}
          search={{ page: undefined, panel }}
        >
          <Button variant="outline" className="border border-[#A4CAFE]">
            <Users className="h-4 w-4" />
            Discussions
          </Button>
        </Link>
      </div>
      <Outlet />
    </div>
  )
}
