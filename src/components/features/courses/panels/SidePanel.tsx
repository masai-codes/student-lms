import { X } from "lucide-react"
import AiChatPanel from "../ai/AiChatPanel"
import AiSummaryPanel from "../ai/AiSummaryPanel"
import NotesPanel from "./NotesPanel"
import AiTutorPanel from "../ai/AiTutorPanel"
import { CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LectureTranscript } from "../lectures/LectureTranscript"

type SidePanel = "default" | "transcript" | "description" | "summary" | "chat"

type PanelQueryState = {
  data: unknown
  isLoading: boolean
  isError: boolean
}


export default function SidePanel({
  panel,
  onClose,
  panelQueries,
}: {
  panel: SidePanel
  onClose: () => void
  panelQueries?: Partial<Record<SidePanel, PanelQueryState>>
}) {
  const titleMap: Record<SidePanel, string> = {
    default: "",
    transcript: "Transcript",
    description: "Description",
    summary: "AI Summary",
    chat: "AI Chat",
  }

  return (
    <div className="border bg-white rounded-xl h-full flex flex-col">
      {panel !== "default" && (
        <CardHeader className="flex items-center justify-between border-b shrink-0 px-6 pt-3">
          <h3 className="font-medium leading-none">
            {titleMap[panel]}
          </h3>

          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

      )}

      <CardContent className="h-full flex items-center justify-center p-2">
        {panel === "default" && <AiTutorPanel />}
        {panel === "transcript" && (
          <LectureTranscript
            data={panelQueries?.transcript?.data}
            isLoading={!!panelQueries?.transcript?.isLoading}
            isError={!!panelQueries?.transcript?.isError}
          />
        )}
        {panel === "description" && (
          <NotesPanel
            data={panelQueries?.description?.data}
            isLoading={!!panelQueries?.description?.isLoading}
            isError={!!panelQueries?.description?.isError}
          />
        )}
        {panel === "summary" && (
          <AiSummaryPanel
            data={panelQueries?.summary?.data}
            isLoading={!!panelQueries?.summary?.isLoading}
            isError={!!panelQueries?.summary?.isError}
          />
        )}
        {panel === "chat" && <AiChatPanel />}
      </CardContent>
    </div>


  )
}
