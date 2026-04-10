import { ScrollArea } from "@/components/ui/scroll-area"

type NotesPanelProps = {
  data: unknown
  isLoading: boolean
  isError: boolean
}

export default function NotesPanel({ data, isLoading, isError }: NotesPanelProps) {
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-sm">
        Loading description...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-red-500">
        Error fetching description
      </div>
    )
  }

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center text-sm">
        No description available for this lecture.
      </div>
    )
  }

  return (
    <ScrollArea className="h-full pr-2">
      <div className="space-y-4 text-sm">
        <h4 className="font-semibold">Description</h4>
        <pre className="whitespace-pre-wrap text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </ScrollArea>
  )
}
