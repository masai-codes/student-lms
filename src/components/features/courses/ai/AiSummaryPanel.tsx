import { ScrollArea } from "@/components/ui/scroll-area"

type AiSummaryPanelProps = {
  data: unknown
  isLoading: boolean
  isError: boolean
}

export default function AiSummaryPanel({ data, isLoading, isError }: AiSummaryPanelProps) {
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-sm">
        Generating AI summary...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-red-500">
        Error fetching AI summary
      </div>
    )
  }

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center text-sm">
        No AI summary available for this lecture.
      </div>
    )
  }

  return (
    <ScrollArea className="h-full pr-2">
      <div className="space-y-4 text-sm">
        <h4 className="font-semibold">AI Summary</h4>
        <pre className="whitespace-pre-wrap text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </ScrollArea>
  )
}
