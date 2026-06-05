import { MapPin, VideoCamera } from '@phosphor-icons/react'
import {
  formatIstDateBadge,
  formatIstLongDate,
  formatIstTimeRange,
} from './eventDetailFormat'
import type { ReactNode } from 'react'
import type { MasaiverseV2EventDetail } from '@/server/api/masaiverse-v2/services/getEventDetail.service'

type EventInfoRowsProps = {
  event: MasaiverseV2EventDetail
}

function InfoRow({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode
  title: string
  subtitle: string | null
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-[12px] border border-white/15 bg-white/10 text-white/80">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-bold leading-5 text-white">
          {title}
        </span>
        {subtitle ? (
          <span className="block truncate text-[13px] leading-5 text-white/60">
            {subtitle}
          </span>
        ) : null}
      </span>
    </div>
  )
}

/**
 * The "when" and "where" rows of the event page — a calendar date badge with
 * the long date + IST time range, and a location/online row reflecting the mode.
 */
export default function EventInfoRows({ event }: EventInfoRowsProps) {
  const badge = formatIstDateBadge(event.startTime, event.endTime)
  const longDate = formatIstLongDate(event.startTime, event.endTime)
  const timeRange = formatIstTimeRange(event.startTime, event.endTime)
  const isOffline = event.mode === 'offline'

  const placeTitle = isOffline
    ? (event.locationTitle ?? 'In-person event')
    : (event.platform ?? 'Online event')
  const placeSubtitle = isOffline
    ? (event.platform ?? null)
    : event.platform
      ? 'Link shared after you register'
      : null

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 flex-col items-center justify-center overflow-hidden rounded-[12px] border border-[#EDEAE8] bg-white leading-none">
          {badge ? (
            <>
              <span className="flex h-[14px] w-full items-center justify-center bg-masaiverse-orange text-[8px] font-bold text-white">
                {badge.month}
              </span>
              <span className="flex flex-1 items-center text-[16px] font-bold text-[#111827]">
                {badge.day}
              </span>
            </>
          ) : null}
        </span>
        <span className="min-w-0">
          <span className="block text-[15px] font-bold leading-5 text-white">
            {longDate ?? 'Date to be announced'}
          </span>
          {timeRange ? (
            <span className="block text-[13px] leading-5 text-white/60">
              {timeRange} IST
            </span>
          ) : null}
        </span>
      </div>

      <InfoRow
        icon={
          isOffline ? (
            <MapPin size={20} weight="bold" />
          ) : (
            <VideoCamera size={20} weight="bold" />
          )
        }
        title={placeTitle}
        subtitle={placeSubtitle}
      />
    </div>
  )
}
