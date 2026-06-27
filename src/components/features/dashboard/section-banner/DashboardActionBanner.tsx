import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { Camera, ChevronLeft, ChevronRight, CircleUserRound, Download, FileText, Smartphone, ThumbsUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { DashboardActionBannersResult, PendingAgreementSection, PendingFeedbackForm } from '@/server/api/dashboard/getDashboardActionBanners.service'
import { OnboardingModal } from '@/components/modals/onboarding/OnboardingModal'
import { DownloadAppModal } from '@/components/features/layout/DownloadAppModal'

type SlideId = string

interface ActionSlide {
  id: SlideId
  Icon: LucideIcon
  text: string
  cta: string
  ctaHref?: string
  ctaIcon?: LucideIcon
  agreementSection?: PendingAgreementSection
  feedbackForm?: PendingFeedbackForm
}

const STATIC_SLIDES: Array<ActionSlide> = [
  {
    id: 'appDownload',
    Icon: Smartphone,
    text: 'Learn on the go with the Masai Learn App',
    cta: 'Download App',
    ctaIcon: Download,
  },
  {
    id: 'profilePicture',
    Icon: CircleUserRound,
    text: 'Complete your profile by adding your profile picture',
    cta: 'Take Photo',
    ctaIcon: Camera,
  },
]

export function DashboardActionBanner({ actionBanners: data }: { actionBanners: DashboardActionBannersResult | undefined }) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('right')
  const touchStartX = useRef<number | null>(null)
  const [onboardingInitialStep, setOnboardingInitialStep] = useState<string | undefined>(undefined)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [downloadAppOpen, setDownloadAppOpen] = useState(false)

  if (!data) return null

  const agreementSlides: Array<ActionSlide> = data.pendingAgreementSections.map((section) => {
    const truncatedName = section.name.length > 18 ? `${section.name.slice(0, 18)}…` : section.name
    return {
      id: `agreement-${section.sectionId}`,
      Icon: FileText,
      text: `Review and sign your ${truncatedName || 'agreement'} to start your course.`,
      cta: `Review ${truncatedName}`,
      agreementSection: section,
    }
  })

  const feedbackSlides: Array<ActionSlide> = data.pendingFeedbackForms.map((form) => ({
    id: `feedback-${form.source}-${form.id}`,
    Icon: ThumbsUp,
    text: `Please complete your feedback form: ${form.title}.`,
    cta: 'Complete Feedback',
    feedbackForm: form,
  }))

  const staticSlides = STATIC_SLIDES.filter((slide) => {
    if (slide.id === 'appDownload') return data.showDownloadApp
    if (slide.id === 'profilePicture') return data.showProfilePicture
    return false
  })

  // Agreement first, then feedback, then zoom/download/profile
  const visibleSlides = [...agreementSlides, ...feedbackSlides, ...staticSlides]

  if (visibleSlides.length === 0) return null

  const count = visibleSlides.length
  const slide = visibleSlides[current % count]
  const { Icon } = slide
  const CtaIcon = slide.ctaIcon

  const prev = () => { setSlideDir('left'); setCurrent((c) => (c - 1 + count) % count) }
  const next = () => { setSlideDir('right'); setCurrent((c) => (c + 1) % count) }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || count <= 1) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) < 40) return // ignore small movements
    if (diff > 0) next(); else prev()
    touchStartX.current = null
  }

  function handleCtaClick(s: ActionSlide) {
    if (s.id === 'appDownload') {
      setDownloadAppOpen(true)
    } else if (s.id === 'profilePicture') {
      setOnboardingInitialStep('photo')
      setOnboardingOpen(true)
    } else if (s.agreementSection) {
      setOnboardingInitialStep(`agreement-${s.agreementSection.sectionId}`)
      setOnboardingOpen(true)
    } else if (s.feedbackForm) {
      const stepId = s.feedbackForm.source === 'assess_nps'
        ? `assess-${s.feedbackForm.id}`
        : `feedback-${s.feedbackForm.id}`
      setOnboardingInitialStep(stepId)
      setOnboardingOpen(true)
    }
  }

  const cardStyle = { background: 'linear-gradient(90.38deg, #4B4396 2.62%, #6962AC 100%)' }
  const ctaLabel = (
    <>
      <span className="lg:hidden">{slide.cta.length > 10 ? `${slide.cta.slice(0, 10)}…` : slide.cta}</span>
      <span className="hidden lg:inline">{slide.cta}</span>
    </>
  )

  return (
    <>
    <div className="flex flex-col gap-2">
      <div>
        {/* Banner card */}
        <div
          className="rounded-2xl px-4 py-3 lg:px-5 lg:pt-4 lg:pb-12 flex flex-row items-center gap-3 lg:gap-4 min-h-[64px]"
          style={cardStyle}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex-1 min-w-0 overflow-hidden">
            <div
              key={slide.id}
              className={`flex flex-row items-center gap-3 lg:gap-4 ${slideDir === 'right' ? 'animate-banner-slide-in-right' : 'animate-banner-slide-in-left'}`}
            >
              {/* Icon + text */}
              <div className="flex items-center gap-3 min-w-0">
                <Icon size={18} className="shrink-0 text-white/80" strokeWidth={1.75} />
                <p className="text-sm font-medium text-white leading-snug">
                  {slide.text}
                </p>
              </div>

              {/* CTA button */}
              {slide.ctaHref ? (
                <a
                  href={slide.ctaHref}
                  target={slide.ctaHref.startsWith('http') ? '_blank' : '_self'}
                  rel={slide.ctaHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-white text-[#4B4396] text-sm font-semibold hover:bg-white/90 transition-colors focus-visible:outline-none whitespace-nowrap shrink-0"
                >
                  {CtaIcon && <CtaIcon size={15} strokeWidth={2} />}
                  {ctaLabel}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => handleCtaClick(slide)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-white text-[#4B4396] text-sm font-semibold hover:bg-white/90 transition-colors focus-visible:outline-none whitespace-nowrap shrink-0"
                >
                  {CtaIcon && <CtaIcon size={15} strokeWidth={2} />}
                  {ctaLabel}
                </button>
              )}
            </div>
          </div>

          {/* Tablet + desktop: prev / dots / next */}
          {count > 1 ? (
            <div className="hidden md:flex items-center gap-1.5 shrink-0">
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
          ) : (
            // Fixed-width invisible spacer so single-item layout matches multi-item
            <div className="hidden md:flex items-center gap-1.5 shrink-0 invisible" aria-hidden="true">
              <div className="w-8 h-8" />
              <div className="flex items-center gap-1.5 px-1">
                <div className="size-2" />
                <div className="size-1.5" />
              </div>
              <div className="w-8 h-8" />
            </div>
          )}
        </div>

      </div>

      {/* Mobile-only: dots below the card */}
      {count > 1 && (
        <div className="md:hidden flex items-center gap-1.5 justify-center">
          {visibleSlides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all focus-visible:outline-none ${
                i === current % count ? 'size-2 bg-[#4B4396]' : 'size-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>

    <DownloadAppModal open={downloadAppOpen} onOpenChange={setDownloadAppOpen} />

    {onboardingOpen && (
      <OnboardingModal
        onClose={() => setOnboardingOpen(false)}
        initialStep={onboardingInitialStep}
        showProfilePhoto={data.showProfilePicture}
        agreementSections={data.pendingAgreementSections}
        feedbackForms={data.pendingFeedbackForms}
        onPhotoSaved={() => {
          void queryClient.invalidateQueries({ queryKey: ['dashboard-left-section'] })
          void router.invalidate()
        }}
        onAgreementSubmitted={() => {
          void queryClient.invalidateQueries({ queryKey: ['dashboard-left-section'] })
        }}
        onFeedbackSubmitted={() => {
          void queryClient.invalidateQueries({ queryKey: ['dashboard-left-section'] })
        }}
      />
    )}
  </>
  )
}
