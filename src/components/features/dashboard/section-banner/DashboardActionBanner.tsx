import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, FileText, Monitor, Smartphone, ThumbsUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AGREEMENT_ONE_LINER } from '@/globalSettings'
import { fetchDashboardActionBanners } from '@/lib/api/dashboard/dashboardApi'

type SlideId = 'agreement' | 'feedback' | 'zoom' | 'appDownload'

interface ActionSlide {
  id: SlideId
  Icon: LucideIcon
  text: string
  cta: string
  ctaHref?: string
}

const ALL_SLIDES: Array<ActionSlide> = [
  {
    id: 'agreement',
    Icon: FileText,
    text: AGREEMENT_ONE_LINER,
    cta: 'Start Learning',
  },
  {
    id: 'feedback',
    Icon: ThumbsUp,
    text: 'Please complete your feedback form',
    cta: 'Complete Feedback',
  },
  {
    id: 'zoom',
    Icon: Monitor,
    text: 'Complete your Zoom authentication',
    cta: 'Start',
  },
  {
    id: 'appDownload',
    Icon: Smartphone,
    text: 'Learn on the go with the Masai Learn App',
    cta: 'Download App',
    ctaHref: 'https://play.google.com/store/apps/details?id=com.lms.masai',
  }
]

export function DashboardActionBanner() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-action-banners'],
    queryFn: fetchDashboardActionBanners,
  })

  const [current, setCurrent] = useState(0)

  if (isLoading) return null

  const visibleSlides = ALL_SLIDES.filter((slide) => {
    if (!data) return slide.id === 'appDownload'
    if (slide.id === 'appDownload') return data.showDownloadApp
    if (slide.id === 'agreement') return data.showAgreement
    if (slide.id === 'feedback') return data.showFeedback
    return data.showZoom
  })

  if (visibleSlides.length === 0) return null

  const count = visibleSlides.length
  const slide = visibleSlides[current % count]
  const { Icon } = slide

  const prev = () => setCurrent((c) => (c - 1 + count) % count)
  const next = () => setCurrent((c) => (c + 1) % count)

  return (
    <div
      className="rounded-2xl px-5 pt-4 pb-12 flex items-center gap-4 min-h-[64px]"
      style={{ background: 'linear-gradient(90.38deg, #4B4396 2.62%, #6962AC 100%)' }}
    >
      {/* Icon + text + CTA */}
      <div className="flex flex-1 items-center gap-4 min-w-0">
        <Icon size={20} className="shrink-0 text-white/80" strokeWidth={1.75} />
        <p className="text-sm font-medium text-white leading-snug min-w-0">
          {slide.text}
        </p>
        {slide.ctaHref ? (
          <a
            href={slide.ctaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-5 py-2 rounded-md bg-white text-[#4B4396] text-sm font-semibold hover:bg-white/90 transition-colors focus-visible:outline-none"
          >
            {slide.cta}
          </a>
        ) : (
          <button
            type="button"
            className="shrink-0 px-5 py-2 rounded-md bg-white text-[#4B4396] text-sm font-semibold hover:bg-white/90 transition-colors focus-visible:outline-none"
          >
            {slide.cta}
          </button>
        )}
      </div>

      {/* Prev / dots / Next — boxy style */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous"
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/30 bg-white/10 text-white hover:bg-white/20 transition-colors focus-visible:outline-none"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-1.5 px-1">
          {visibleSlides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all focus-visible:outline-none ${
                i === current % count ? 'size-2 bg-white' : 'size-1.5 bg-white/35'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={next}
          aria-label="Next"
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/30 bg-white/10 text-white hover:bg-white/20 transition-colors focus-visible:outline-none"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
