import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ArrowRight, ArrowsLeftRight } from '@phosphor-icons/react'
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
 * "Your batch transfer request to … has been considered" banners, one per
 * pending transfer. A plain bordered card (no gradient) — swipable with dots
 * when there is more than one. The CTA sends the learner to admissions to finish
 * the process (which may involve a payment, a refund, or nothing at all, so the
 * copy stays neutral). Disabled when no URL is available (SSO not configured).
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
      className="rounded-xl border border-border bg-surface px-4 py-3.5"
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner) => (
            <div key={banner.batchUserId} className="min-w-0 flex-[0_0_100%]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="bg-info-subtle text-info-subtle-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <ArrowsLeftRight size={18} weight="bold" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-foreground-subtle text-xs font-semibold">
                      Batch transfer
                    </p>
                    <p
                      data-testid="dashboard-batch-transfer-text"
                      className="text-foreground mt-0.5 text-sm"
                    >
                      Your batch transfer request to{' '}
                      <span className="font-semibold">
                        {banner.courseTitle}
                      </span>{' '}
                      has been considered. Please complete the process as soon
                      as possible.
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
                  className={`bg-brand text-brand-foreground focus-visible:ring-brand inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 ${
                    banner.paymentUrl === null
                      ? 'pointer-events-none opacity-50'
                      : ''
                  }`}
                >
                  Complete Process
                  <ArrowRight size={16} weight="bold" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {hasMultiple && (
        <div
          className="mt-3 flex justify-center gap-1.5"
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
                i === selected ? 'bg-brand w-4' : 'bg-border w-1.5'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
