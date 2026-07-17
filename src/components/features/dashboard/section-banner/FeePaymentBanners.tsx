import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ArrowRight, Warning, WarningCircle } from '@phosphor-icons/react'
import { BannerArrow } from './BannerArrow'
import {
  FEE_PAYMENT_AUTOPLAY_MS,
  useCarouselAutoplay,
} from './useCarouselAutoplay'
import { pushDashboardEvent } from '../shared/dashboardAnalytics'
import type { FeePaymentBanner } from '@/server/api/dashboard/t0/getFeePaymentBanner.service'
import type { EmblaCarouselType } from 'embla-carousel'

interface FeePaymentBannersProps {
  banners: Array<FeePaymentBanner>
  /**
   * Stack the slide vertically (course + message, then a full-width CTA) for
   * narrow containers like the guided-tour side panel, so it doesn't overflow.
   */
  compact?: boolean
}

/**
 * Fee-payment banners for T0 + PARTIAL_FEES learners — one slide per batch with
 * a pending payment, shown as a swipable carousel (drag + centered dots inside
 * the banner, no arrows) with the course name on each slide. Each slide is
 * either a `timer` (soft-orange nudge with a days-remaining pill) or `overdue`
 * (red warning). The "Unlock Full Access" CTA opens that batch's payment URL.
 */
export function FeePaymentBanners({
  banners,
  compact = false,
}: FeePaymentBannersProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [selected, setSelected] = useState(0)

  const onSelect = useCallback((api: EmblaCarouselType) => {
    setSelected(api.selectedScrollSnap())
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    onSelect(emblaApi)
    emblaApi.on('select', onSelect).on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect).off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  const autoplay = useCarouselAutoplay(
    emblaApi,
    banners.length,
    FEE_PAYMENT_AUTOPLAY_MS,
  )

  if (banners.length === 0) return null

  const hasMultiple = banners.length > 1

  return (
    <div
      {...autoplay}
      data-testid="dashboard-fee-payment-carousel"
      className="relative"
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner) => (
            <div key={banner.batchId} className="min-w-0 flex-[0_0_100%]">
              <FeePaymentSlide
                banner={banner}
                reserveDotSpace={hasMultiple}
                compact={compact}
              />
            </div>
          ))}
        </div>
      </div>

      {hasMultiple && (
        <div className="absolute inset-x-0 bottom-1 flex items-center justify-center gap-2">
          <BannerArrow
            direction="prev"
            tone="light"
            label="payment banner"
            testIdBase="dashboard-fee-payment"
            onClick={() => emblaApi?.scrollPrev()}
          />
          <div
            className="flex justify-center gap-1.5"
            data-testid="dashboard-fee-payment-dots"
          >
            {banners.map((b, i) => (
              <button
                key={b.batchId}
                type="button"
                aria-label={`Go to ${b.courseTitle}`}
                data-active={i === selected}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`size-1.5 rounded-full transition-colors ${
                  i === selected ? 'bg-brand' : 'bg-brand/30'
                }`}
              />
            ))}
          </div>
          <BannerArrow
            direction="next"
            tone="light"
            label="payment banner"
            testIdBase="dashboard-fee-payment"
            onClick={() => emblaApi?.scrollNext()}
          />
        </div>
      )}
    </div>
  )
}

/** Countdown label for a timer banner: hours when under a day left, else days. */
function timerLabel(
  banner: Extract<FeePaymentBanner, { type: 'timer' }>,
): string {
  if (banner.hoursRemaining !== null) {
    return `${banner.hoursRemaining} ${banner.hoursRemaining === 1 ? 'hour' : 'hours'} remaining`
  }
  return `${banner.daysRemaining} ${banner.daysRemaining === 1 ? 'day' : 'days'} remaining`
}

function FeePaymentSlide({
  banner,
  reserveDotSpace,
  compact,
}: {
  banner: FeePaymentBanner
  reserveDotSpace: boolean
  compact: boolean
}) {
  const isOverdue = banner.type === 'overdue'
  const surface = isOverdue
    ? 'border-danger bg-danger-subtle'
    : 'border-[#E76E4B] bg-[#FFF1E9] dark:border-warning-subtle dark:bg-warning-subtle'
  const iconSize = compact ? 20 : 24

  const icon = isOverdue ? (
    <Warning
      size={iconSize}
      weight="fill"
      className="shrink-0 animate-pulse text-danger"
      aria-hidden
    />
  ) : (
    <WarningCircle
      size={iconSize}
      weight="fill"
      className="shrink-0 text-[#E76E4B] dark:text-warning-subtle-foreground"
      aria-hidden
    />
  )

  const course = (
    <p
      data-testid="dashboard-fee-payment-course"
      title={banner.courseTitle}
      className={`truncate text-sm font-bold ${isOverdue ? 'text-danger' : 'text-foreground'}`}
    >
      {banner.courseTitle}
    </p>
  )

  const message = (
    <p
      className={`text-xs font-medium ${compact ? '' : 'truncate'} ${isOverdue ? 'text-danger' : 'text-[#9A4B22] dark:text-warning-subtle-foreground'}`}
    >
      {isOverdue
        ? 'Payment Overdue! Complete the payment to avoid course deactivation'
        : 'Pay your remaining program fee to avoid interruption and unlock full access'}
    </p>
  )

  const daysPill = (
    <span
      data-testid="dashboard-fee-payment-days"
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-white ${
        isOverdue ? 'bg-danger' : 'bg-[#E76E4B]'
      }`}
    >
      <span className="relative flex size-1.5" aria-hidden>
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-surface opacity-75" />
        <span className="relative inline-flex size-1.5 rounded-full bg-surface" />
      </span>
      {banner.type === 'timer'
        ? timerLabel(banner)
        : `${banner.daysOverdue} ${banner.daysOverdue === 1 ? 'day' : 'days'} overdue`}
    </span>
  )

  const cta = (
    <a
      href={banner.paymentUrl ?? undefined}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="dashboard-fee-payment-cta"
      onClick={() =>
        pushDashboardEvent('l_dashboard_fee_payment_cta_id_' + banner.batchId, {
          batch_id: banner.batchId,
          banner_type: banner.type,
          course_title: banner.courseTitle,
        })
      }
      aria-disabled={banner.paymentUrl === null}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-sm transition-colors hover:bg-[#4d3b77] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
        compact ? 'w-full' : 'shrink-0'
      } ${banner.paymentUrl === null ? 'pointer-events-none opacity-50' : ''}`}
    >
      Unlock Full Access
      <ArrowRight size={16} weight="bold" />
    </a>
  )

  // Compact (narrow side panel): stack so nothing overflows.
  if (compact) {
    return (
      <div
        data-testid="dashboard-fee-payment-banner"
        data-variant={banner.type}
        className={`flex flex-col gap-2 rounded-xl border-l-4 px-3 pt-3 shadow-sm ${reserveDotSpace ? 'pb-9' : 'pb-3'} ${surface}`}
      >
        <div className="flex items-center gap-2">
          {icon}
          <div className="min-w-0 flex-1">{course}</div>
          {daysPill}
        </div>
        {message}
        {cta}
      </div>
    )
  }

  // Default (wide): single row.
  return (
    <div
      data-testid="dashboard-fee-payment-banner"
      data-variant={banner.type}
      className={`flex flex-wrap items-center gap-3 rounded-xl border-l-4 px-4 pt-3 shadow-sm md:flex-nowrap ${
        reserveDotSpace ? 'pb-9' : 'pb-3'
      } ${surface}`}
    >
      {icon}
      <div className="min-w-0 flex-1">
        {course}
        {message}
      </div>
      {daysPill}
      {cta}
    </div>
  )
}
