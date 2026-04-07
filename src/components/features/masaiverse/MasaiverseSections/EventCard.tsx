import type { EventType } from "@/server/masaiverse/fetchEvents"
import { Button } from "@/components/ui/button"

type EventCardProps = {
  event: EventType
  onJoin?: (event: EventType) => void
}

export default function EventCard({ event, onJoin }: EventCardProps) {
  return (
    <article className="rounded-xl border border-[#E5E7EB] bg-white p-4">
      <p className="text-lg font-semibold text-[#111827]">{event.title}</p>
      <p className="mt-1 text-sm font-medium capitalize text-[#4B5563]">
        {event.category || "event"} • {event.mode || "mode"}
      </p>
      <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-[#6B7280]">
        {event.description || "No description available."}
      </p>
      <Button className="mt-4 w-full" onClick={() => onJoin?.(event)}>
        Join
      </Button>
    </article>
  )
}
