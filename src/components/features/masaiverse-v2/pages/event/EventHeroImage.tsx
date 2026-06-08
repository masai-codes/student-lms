import { CalendarBlank } from '@phosphor-icons/react'
import type { MasaiverseV2EventDetail } from '@/server/api/masaiverse-v2/services/getEventDetail.service'

type EventHeroImageProps = {
  event: MasaiverseV2EventDetail
}

/**
 * Luma-style square hero for the event. Shows the banner image when set, a
 * branded placeholder otherwise, with a LIVE badge while the event is ongoing.
 */
export default function EventHeroImage({ event }: EventHeroImageProps) {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-[20px] bg-[#1C1A19]">
      {event.imageUrl ? (
        <img
          src={event.imageUrl}
          alt={event.title}
          className="size-full object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center text-white/30">
          <CalendarBlank size={72} weight="light" />
        </div>
      )}

      {event.status === 'live' ? (
        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[#EF4444] px-3 py-1 text-[12px] font-bold uppercase leading-none text-white">
          <span className="size-1.5 rounded-full bg-white" />
          Live
        </span>
      ) : null}
    </div>
  )
}
