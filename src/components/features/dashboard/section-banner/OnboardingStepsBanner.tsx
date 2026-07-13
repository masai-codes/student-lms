import { useCallback, useEffect, useRef, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ArrowRight } from '@phosphor-icons/react'
import { BannerArrow } from './BannerArrow'
import { ONBOARDING_AUTOPLAY_MS, useCarouselAutoplay } from './useCarouselAutoplay'
import { pushDashboardEvent } from '../shared/dashboardAnalytics'
import type { OnboardingBanner } from './onboardingBanners'
import type { EmblaCarouselType } from 'embla-carousel'

interface OnboardingStepsBannerProps {
  banners: Array<OnboardingBanner>
  /** Reopen the guided tour for a course on the tab that still has work. */
  onResume: (batchId: number, tab: 'lms' | 'program') => void
}

/**
 * Purple onboarding banner shown at the top of the dashboard for T0 learners who
 * still have mandatory guided-tour steps pending. One slide per course (the
 * course title is shown so multi-course learners can tell them apart); embla
 * powers drag-to-swipe, with dots centered below (multi-course only). Its bottom
 * corners are square so it sits flush against the white content card below.
 */
export function OnboardingStepsBanner({ banners, onResume }: OnboardingStepsBannerProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })

  const [selected, setSelected] = useState(0)
  // True when the pointer moved (dragged) since the last pointer-down, so the
  // trailing click after a swipe doesn't fire the resume action.
  const draggedRef = useRef(false)

  const onSelect = useCallback((api: EmblaCarouselType) => {
    setSelected(api.selectedScrollSnap())
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    const markDragStart = () => {
      draggedRef.current = false
    }
    const markDragged = () => {
      draggedRef.current = true
    }
    onSelect(emblaApi)
    emblaApi
      .on('select', onSelect)
      .on('reInit', onSelect)
      .on('pointerDown', markDragStart)
      .on('scroll', markDragged)
    return () => {
      emblaApi
        .off('select', onSelect)
        .off('reInit', onSelect)
        .off('pointerDown', markDragStart)
        .off('scroll', markDragged)
    }
  }, [emblaApi, onSelect])

  const autoplay = useCarouselAutoplay(emblaApi, banners.length, ONBOARDING_AUTOPLAY_MS)

  if (banners.length === 0) return null

  const hasMultiple = banners.length > 1

  return (
    <div
      {...autoplay}
      data-testid="dashboard-onboarding-banner"
      className="rounded-t-2xl bg-gradient-to-r from-[#5B52A3] to-[#6E66B8] px-5 py-3.5 text-white"
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner) => (
            <div key={banner.batchId} className="min-w-0 flex-[0_0_100%]">
              <OnboardingSlide
                banner={banner}
                onResume={() => {
                  if (draggedRef.current) return
                  pushDashboardEvent('l_dashboard_onboarding_resume_id_' + banner.batchId, {
                    batch_id: banner.batchId,
                    target_tab: banner.targetTab,
                    completed: banner.completed,
                    total: banner.total,
                  })
                  onResume(banner.batchId, banner.targetTab)
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {hasMultiple && (
        <div className="mt-2.5 flex items-center justify-center gap-2">
          <BannerArrow
            direction="prev"
            tone="dark"
            label="onboarding banner"
            testIdBase="dashboard-onboarding-banner"
            onClick={() => emblaApi?.scrollPrev()}
          />
          <div className="flex justify-center gap-1.5" data-testid="dashboard-onboarding-banner-dots">
            {banners.map((b, i) => (
              <button
                key={b.batchId}
                type="button"
                aria-label={`Go to ${b.courseTitle}`}
                data-active={i === selected}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`size-1.5 rounded-full transition-colors ${
                  i === selected ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
          <BannerArrow
            direction="next"
            tone="dark"
            label="onboarding banner"
            testIdBase="dashboard-onboarding-banner"
            onClick={() => emblaApi?.scrollNext()}
          />
        </div>
      )}
    </div>
  )
}

function OnboardingSlide({
  banner,
  onResume,
}: {
  banner: OnboardingBanner
  onResume: () => void
}) {
  // A pending banner always has at least one step left (completed < total).
  const remaining = Math.max(banner.total - banner.completed, 0)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <StepsLeftCounter remaining={remaining} />
        <div className="min-w-0">
          <p
            data-testid="dashboard-onboarding-banner-title"
            title={banner.courseTitle}
            className="line-clamp-2 text-sm font-semibold sm:truncate md:text-base"
          >
            Finish onboarding for {banner.courseTitle}
          </p>
          <p data-testid="dashboard-onboarding-banner-progress" className="mt-0.5 truncate text-xs text-white/80">
            {banner.completed}/{banner.total} steps completed — don&apos;t lose your spot
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onResume}
        data-testid="dashboard-onboarding-banner-resume"
        className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#5B52A3] transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:w-auto"
      >
        Finish Now
        <ArrowRight size={16} weight="bold" />
      </button>
    </div>
  )
}

/**
 * The hero element: how many steps are still pending, in a bright amber chip
 * that pops against the purple banner. A pulsing dot adds urgency. The number is
 * the largest thing on the slide so the learner sees the cost at a glance.
 */
function StepsLeftCounter({ remaining }: { remaining: number }) {
  return (
    <div
      data-testid="dashboard-onboarding-banner-count"
      className="flex shrink-0 items-center gap-2 rounded-xl bg-[#FFC24B] px-3 py-1.5 text-[#4A3F7A] shadow-sm"
    >
      <span className="relative flex size-2" aria-hidden>
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#5B52A3] opacity-70" />
        <span className="relative inline-flex size-2 rounded-full bg-[#5B52A3]" />
      </span>
      <span className="whitespace-nowrap font-bold leading-none">
        <span className="text-xl">{remaining}</span>
        <span className="ml-1 text-xs uppercase tracking-wide">
          {remaining === 1 ? 'step left' : 'steps left'}
        </span>
      </span>
    </div>
  )
}
