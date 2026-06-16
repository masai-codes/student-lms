import { MapPin, VideoCamera } from '@phosphor-icons/react'
import { formatLocalDateBadge, formatLocalSchedule } from './eventDetailFormat'
import type { ReactNode } from 'react'
import type { MasaiverseV2EventDetail } from '@/server/api/masaiverse-v2/services/getEventDetail.service'

type EventInfoRowsProps = {
  event: MasaiverseV2EventDetail
  /** Device/server clock skew (ms) so times render on the viewer's clock. */
  skewMs?: number
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
      <span className="flex size-11 shrink-0 items-center justify-center rounded-[12px] border border-[#EDEAE8] bg-[#FAF8F6] text-[#4B5563]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-bold leading-5 text-[#111827]">
          {title}
        </span>
        {subtitle ? (
          <span className="block truncate text-[13px] leading-5 text-[#6B7280]">
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
export default function EventInfoRows({
  event,
  skewMs = 0,
}: EventInfoRowsProps) {
  const badge = formatLocalDateBadge(event.startTime, event.endTime, skewMs)
  const { dateLine, timeLine } = formatLocalSchedule(
    event.startTime,
    event.endTime,
    skewMs,
  )
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
          <span className="block text-[15px] font-bold leading-5 text-[#111827]">
            {dateLine ?? 'Date to be announced'}
          </span>
          {timeLine ? (
            <span className="block text-[13px] leading-5 text-[#6B7280]">
              {timeLine}
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
