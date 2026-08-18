import { Link } from '@tanstack/react-router'
import { ArrowRight, User } from '@phosphor-icons/react'
import type { CalendarEventDto } from '@/server/api/calendar/calendarTypes'
import { calendarEntityEvent, pushCalendarEvent } from './calendarAnalytics'
import { Modal, ModalContent, ModalTitle } from '@/components/ui/modal'
import { LocalTimeWithIstTooltip } from '@/components/shared/local-time-with-ist-tooltip'
import { LearnListingJoinLiveCta } from '@/components/features/learn/section-three/content-card/LearnListingJoinLiveCta'
import { calendarTypeStyle } from '@/lib/calendar/calendarColors'
import {
  formatScheduleRangeIST,
  formatScheduleRangeLocal,
} from '@/utils/timeZoneHandler'
import { cn } from '@/lib/utils'

interface EventDetailsModalProps {
  event: CalendarEventDto | null
  onClose: () => void
}

/**
 * Event detail dialog: type badge, local time (IST on hover for non-IST
 * viewers), instructor, batch, join-live CTA for live lectures, and a "View
 * details" link. Quizzes have no detail route yet, so no link for them.
 */
export function EventDetailsModal({ event, onClose }: EventDetailsModalProps) {
  if (!event) return null
  const style = calendarTypeStyle(event.type)
  // `concludes` may be null (end derived server-side) — show the derived end.
  const endForDisplay = event.concludes ?? event.effectiveEnd

  return (
    <Modal open onOpenChange={(open) => (open ? undefined : onClose())}>
      <ModalContent
        data-testid="my-calendar-event-modal"
        aria-describedby={undefined}
      >
        <div className="space-y-4">
          <div className="space-y-2 pr-8">
            <span
              data-testid="my-calendar-event-modal-type"
              className={cn(
                'animate-dash-pop inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                style.badgeClass,
              )}
            >
              <span
                aria-hidden
                className={cn('size-1.5 rounded-full', style.dotClass)}
              />
              {style.label}
              {event.optional ? ' · Optional' : ''}
            </span>
            <ModalTitle
              data-testid="my-calendar-event-modal-title"
              className="break-words text-lg font-semibold text-foreground"
            >
              {event.title}
            </ModalTitle>
          </div>

          <div className="space-y-1.5 text-sm text-foreground-muted">
            <span data-testid="my-calendar-event-modal-time" className="block">
              <LocalTimeWithIstTooltip
                className="font-medium text-foreground"
                local={formatScheduleRangeLocal(event.schedule, endForDisplay)}
                ist={formatScheduleRangeIST(event.schedule, endForDisplay)}
              />
            </span>
            {event.hostName ? (
              <p
                data-testid="my-calendar-event-modal-host"
                className="flex items-center gap-1.5"
              >
                <User aria-hidden className="size-4 shrink-0" />
                {event.hostName}
              </p>
            ) : null}
            {event.batchName ? (
              <p
                data-testid="my-calendar-event-modal-batch"
                className="text-xs text-foreground-subtle"
              >
                {event.batchName}
                {event.sectionName ? ` · ${event.sectionName}` : ''}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {event.joinLive ? (
              <LearnListingJoinLiveCta
                joinLive={event.joinLive.state}
                joinZoomLink={event.joinLive.joinZoomLink}
                isNewZoomRedirection={event.joinLive.isNewZoomRedirection}
                enableZoomWebView={event.joinLive.enableZoomWebView}
                lectureId={event.id}
                title={event.title}
              />
            ) : null}
            {event.detailPath ? (
              <Link
                to={event.detailPath}
                data-testid="my-calendar-event-modal-details-link"
                onClick={() =>
                  pushCalendarEvent(
                    calendarEntityEvent(event.type, 'view_details', event.id),
                    { title: event.title },
                  )
                }
                className="group inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-brand-foreground transition-transform duration-150 ease-out hover:-translate-y-px active:scale-95"
              >
                View details
                <ArrowRight
                  aria-hidden
                  className="size-3.5 transition-transform duration-150 group-hover:translate-x-1"
                />
              </Link>
            ) : null}
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}
