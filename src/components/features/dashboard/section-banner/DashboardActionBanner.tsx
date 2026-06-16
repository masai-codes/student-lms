import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { Camera, ChevronLeft, ChevronRight, CircleUserRound, Download, FileText, Monitor, Smartphone, ThumbsUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { DashboardActionBannersResult, PendingAgreementSection, PendingFeedbackForm } from '@/server/api/dashboard/getDashboardActionBanners.service'
import { OnboardingModal } from '@/components/modals/onboarding/OnboardingModal'

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
    ctaIcon: Download,
    ctaHref: 'https://play.google.com/store/apps/details?id=com.lms.masai',
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
  const [onboardingInitialStep, setOnboardingInitialStep] = useState<string | undefined>(undefined)
  const [onboardingOpen, setOnboardingOpen] = useState(false)

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
    return data.showZoom
  })

  // Agreement first, then feedback, then zoom/download/profile
  const visibleSlides = [...agreementSlides, ...feedbackSlides, ...staticSlides]

  if (visibleSlides.length === 0) return null

  const count = visibleSlides.length
  const slide = visibleSlides[current % count]
  const { Icon } = slide
  const CtaIcon = slide.ctaIcon

  const prev = () => setCurrent((c) => (c - 1 + count) % count)
  const next = () => setCurrent((c) => (c + 1) % count)

  return (
    <>
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
            target={slide.ctaHref.startsWith('http') ? '_blank' : '_self'}
            rel={slide.ctaHref.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="shrink-0 flex items-center gap-1.5 px-5 py-2 rounded-md bg-white text-[#4B4396] text-sm font-semibold hover:bg-white/90 transition-colors focus-visible:outline-none"
          >
            {CtaIcon && <CtaIcon size={15} strokeWidth={2} />}
            {slide.cta}
          </a>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (slide.id === 'profilePicture') {
                setOnboardingInitialStep('photo')
                setOnboardingOpen(true)
              } else if (slide.agreementSection) {
                setOnboardingInitialStep(`agreement-${slide.agreementSection.sectionId}`)
                setOnboardingOpen(true)
              } else if (slide.feedbackForm) {
                const stepId = slide.feedbackForm.source === 'assess_nps'
                  ? `assess-${slide.feedbackForm.id}`
                  : `feedback-${slide.feedbackForm.id}`
                setOnboardingInitialStep(stepId)
                setOnboardingOpen(true)
              }
            }}
            className="shrink-0 flex items-center gap-1.5 px-5 py-2 rounded-md bg-white text-[#4B4396] text-sm font-semibold hover:bg-white/90 transition-colors focus-visible:outline-none"
          >
            {CtaIcon && <CtaIcon size={15} strokeWidth={2} />}
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
      />
    )}
  </>
  )
}
