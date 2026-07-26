import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ArrowRight, ArrowsLeftRight } from '@phosphor-icons/react'
import { BannerArrow } from './BannerArrow'
import {
  BATCH_TRANSFER_AUTOPLAY_MS,
  useCarouselAutoplay,
} from './useCarouselAutoplay'
import { pushDashboardEvent } from '../shared/dashboardAnalytics'
import type { BatchTransferPaymentBanner } from '@/server/api/dashboard/getBatchTransferPaymentBanners.service'
import type { EmblaCarouselType } from 'embla-carousel'

interface BatchTransferPaymentBannersProps {
  banners: Array<BatchTransferPaymentBanner>
}

/**
 * "Your batch transfer request has been considered — complete the payment"
 * banners, one per pending transfer. Swipable (drag + centered dots) and
 * auto-advancing with more than one. The CTA opens the admissions payment page;
 * it's disabled when no URL is available (SSO not configured).
 */
export function BatchTransferPaymentBanners({
  banners,
}: BatchTransferPaymentBannersProps) {
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
    BATCH_TRANSFER_AUTOPLAY_MS,
  )

  if (banners.length === 0) return null

  const hasMultiple = banners.length > 1

  return (
    <div
      {...autoplay}
      data-testid="dashboard-batch-transfer-banner"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#4F6BED] via-[#6D5FE0] to-[#7C3AED] px-5 pt-4 pb-5 text-white shadow-sm"
    >
      {/* Decorative transfer glyph wash */}
      <ArrowsLeftRight
        size={120}
        weight="fill"
        className="pointer-events-none absolute -right-6 -top-8 text-white/10"
        aria-hidden
      />

      <div className="relative overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner) => (
            <div key={banner.batchUserId} className="min-w-0 flex-[0_0_100%]">
              <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3.5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface/15 backdrop-blur-sm">
                    <ArrowsLeftRight size={24} weight="bold" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80">
                      Batch transfer
                    </p>
                    <p
                      data-testid="dashboard-batch-transfer-text"
                      className="mt-0.5 text-sm font-medium md:text-base"
                    >
                      Your transfer to{' '}
                      <span className="font-bold">{banner.courseTitle}</span>{' '}
                      has been considered — complete the payment to confirm your
                      seat.
                    </p>
                  </div>
                </div>

                <a
                  href={banner.paymentUrl ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="dashboard-batch-transfer-cta"
                  onClick={() =>
                    pushDashboardEvent(
                      'l_dashboard_batch_transfer_cta_id_' + banner.toBatchId,
                      {
                        to_batch_id: banner.toBatchId,
                        course_title: banner.courseTitle,
                      },
                    )
                  }
                  aria-disabled={banner.paymentUrl === null}
                  className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-surface px-4 py-2 text-sm font-semibold text-brand shadow-sm transition-transform hover:-translate-y-px active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface ${
                    banner.paymentUrl === null
                      ? 'pointer-events-none opacity-50'
                      : ''
                  }`}
                >
                  Complete Payment
                  <ArrowRight size={16} weight="bold" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {hasMultiple && (
        <div className="relative mt-3 flex items-center justify-center gap-2">
          <BannerArrow
            direction="prev"
            tone="dark"
            label="batch transfer banner"
            testIdBase="dashboard-batch-transfer"
            onClick={() => emblaApi?.scrollPrev()}
          />
          <div
            className="flex justify-center gap-1.5"
            data-testid="dashboard-batch-transfer-dots"
          >
            {banners.map((b, i) => (
              <button
                key={b.batchUserId}
                type="button"
                aria-label={`Go to ${b.courseTitle}`}
                data-active={i === selected}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === selected ? 'w-4 bg-surface' : 'w-1.5 bg-surface/40'
                }`}
              />
            ))}
          </div>
          <BannerArrow
            direction="next"
            tone="dark"
            label="batch transfer banner"
            testIdBase="dashboard-batch-transfer"
            onClick={() => emblaApi?.scrollNext()}
          />
        </div>
      )}
    </div>
  )
}
