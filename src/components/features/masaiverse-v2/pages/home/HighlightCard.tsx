import type { MasaiverseV2HomeHighlight } from '@/server/api/masaiverse-v2/services/getHomeHighlights.service'
import { formatIstDateTime } from '@/lib/masaiverseEventCard'

type HighlightCardProps = {
  highlight: MasaiverseV2HomeHighlight
}

export default function HighlightCard({ highlight }: HighlightCardProps) {
  const startLabel = formatIstDateTime(highlight.startTime)

  return (
    <div className="flex h-full gap-3 rounded-[14px] border border-[#EDEAE8] bg-white p-4">
      {highlight.pastEventEmojiValue ? (
        <span className="text-[24px] leading-none">
          {highlight.pastEventEmojiValue}
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        {highlight.aboveTitle ? (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
            {highlight.aboveTitle}
          </p>
        ) : null}
        <p className="mt-1 text-[15px] font-bold leading-5 text-[#111827]">
          {highlight.title}
        </p>
        {highlight.belowTitle ? (
          <p className="mt-1 text-[13px] leading-5 text-[#6B7280]">
            {highlight.belowTitle}
          </p>
        ) : null}
      </div>
      {startLabel ? (
        <span className="shrink-0 self-start whitespace-nowrap text-[12px] leading-4 text-[#9CA3AF]">
          {startLabel}
        </span>
      ) : null}
    </div>
  )
}
