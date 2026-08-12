import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { CalendarBlank, Sparkle } from '@phosphor-icons/react'
import { BannerArrow } from './BannerArrow'
import {
  BATCH_START_AUTOPLAY_MS,
  useCarouselAutoplay,
} from './useCarouselAutoplay'
import type { BatchStartBanner } from '@/server/api/dashboard/getBatchStartBanners.service'
import type { EmblaCarouselType } from 'embla-carousel'

interface BatchStartBannersProps {
  banners: Array<BatchStartBanner>
}

/**
 * "Your course … will start on {date}" banners for enrolled batches with an
 * upcoming start date. A vivid gradient card, swipable (drag + centered dots
 * inside the banner) and auto-advancing every 5s (looping) with more than one.
 */
export function BatchStartBanners({ banners }: BatchStartBannersProps) {
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
    BATCH_START_AUTOPLAY_MS,
  )

  if (banners.length === 0) return null

  const hasMultiple = banners.length > 1

  return (
    <div
      {...autoplay}
      data-testid="dashboard-batch-start-banner"
      className="banner-hero relative overflow-hidden rounded-2xl px-5 pt-4 pb-5 shadow-sm"
    >
      {/* Decorative sparkle wash */}
      <Sparkle
        size={120}
        weight="fill"
        className="pointer-events-none absolute -right-6 -top-8 text-white/10"
        aria-hidden
      />

      <div className="relative overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner) => (
            <div key={banner.batchId} className="min-w-0 flex-[0_0_100%]">
              <div className="flex items-center gap-3.5">
                {/* Constant white tints — they sit on the `banner-hero` gradient in both themes. */}
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                  <CalendarBlank size={24} weight="bold" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80">
                    Upcoming batch
                  </p>
                  <p
                    data-testid="dashboard-batch-start-text"
                    className="mt-0.5 truncate text-sm font-medium md:text-base"
                  >
                    Your program{' '}
                    <span className="font-bold">{banner.courseTitle}</span> will
                    start on{' '}
                    <span className="rounded-md bg-white/20 px-1.5 py-0.5 font-bold whitespace-nowrap">
                      {banner.startDateLabel}
                    </span>
                  </p>
                </div>
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
            label="batch banner"
            testIdBase="dashboard-batch-start"
            onClick={() => emblaApi?.scrollPrev()}
          />
          <div
            className="flex justify-center gap-1.5"
            data-testid="dashboard-batch-start-dots"
          >
            {banners.map((b, i) => (
              <button
                key={b.batchId}
                type="button"
                aria-label={`Go to ${b.courseTitle}`}
                data-active={i === selected}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === selected ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
          <BannerArrow
            direction="next"
            tone="dark"
            label="batch banner"
            testIdBase="dashboard-batch-start"
            onClick={() => emblaApi?.scrollNext()}
          />
        </div>
      )}
    </div>
  )
}
