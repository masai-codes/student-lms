import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { GuidedTourVideoStep } from './GuidedTourVideoStep'
import { GuidedTourStepPanel } from './GuidedTourStepPanel'
import type { GuidedTourStep } from './steps'

interface GuidedTourActivePanelProps {
  step: GuidedTourStep | undefined
  batchId: number
  tab: 'lms' | 'program'
  profilePhotoUrl: string | null
  onReported: () => void
  /** Segment-bar context: total video steps in this tab + the active video's index. */
  videoCount: number
  videoIndex: number
  /** Autoplay the active video (set when the previous one auto-advanced here). */
  autoPlayVideo: boolean
  /** Fired when the active video ends (drives auto-advance to the next video). */
  onVideoEnded: () => void
  /** Back / Next through the step list; disabled at the respective ends. */
  hasPrev: boolean
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
}

/**
 * Right panel of the guided tour: the active step's centred title, its content
 * (video player for video steps, else the fixed-step panel), and a pinned
 * Back / Next footer to move through the step list (videos also auto-advance).
 * The agreement runs its own multi-step flow with its own footer.
 */
export function GuidedTourActivePanel({
  step,
  batchId,
  tab,
  profilePhotoUrl,
  onReported,
  videoCount,
  videoIndex,
  autoPlayVideo,
  onVideoEnded,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: GuidedTourActivePanelProps) {
  if (!step) return null

  const isVideo = step.kind === 'video' && step.video !== undefined

  // The agreement is a self-contained full-height card (own header, scroll, and
  // pinned Back/Continue), so it skips the generic title + padded wrapper.
  if (step.action === 'agreement') {
    return (
      <div className="flex h-full min-h-0 min-w-0 flex-col" data-testid="guided-tour-active-panel">
        <GuidedTourStepPanel step={step} batchId={batchId} profilePhotoUrl={profilePhotoUrl} onCompleted={onReported} />
      </div>
    )
  }

  return (
    <div className="flex h-full w-full min-w-0 flex-col" data-testid="guided-tour-active-panel">
      <h2 className="shrink-0 px-4 pt-4 text-center text-base font-semibold text-gray-900 md:px-6 md:pt-6 md:text-lg" data-testid="guided-tour-active-title">
        {step.title}
      </h2>

      {/* On desktop only this region scrolls, so the panel never overflows its
          card; on mobile the page scrolls naturally. Extra bottom padding on
          mobile keeps the Back/Next footer clear of the fixed bottom tab bar
          and any floating banner. */}
      <div className="mt-3 min-w-0 flex-1 px-4 pb-28 md:mt-4 md:px-6 md:pb-6 md:min-h-0 md:overflow-y-auto">
        {isVideo && step.video ? (
          <GuidedTourVideoStep
            key={step.key}
            lectureId={step.video.lectureId}
            videoUrl={step.video.videoUrl}
            batchId={batchId}
            tab={tab}
            onReported={onReported}
            videoCount={videoCount}
            videoIndex={videoIndex}
            autoPlay={autoPlayVideo}
            onEnded={onVideoEnded}
          />
        ) : (
          <GuidedTourStepPanel step={step} batchId={batchId} profilePhotoUrl={profilePhotoUrl} onCompleted={onReported} />
        )}

        {/* Back / Next directly below the content; both stay visible, each disables at its end. */}
        <div
          className="mt-4 flex items-center justify-between gap-3"
          data-testid="guided-tour-step-nav"
        >
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            className={NAV_BTN}
            data-testid="guided-tour-step-prev"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            className={NAV_BTN}
            data-testid="guided-tour-step-next"
          >
            Next
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}

// Light-lavender CTA matching the guided tour's #6962AC accent.
const NAV_BTN =
  'inline-flex items-center gap-2 rounded-lg bg-[#6962AC]/5 px-5 py-2.5 text-sm font-semibold text-[#6962AC] transition-colors hover:bg-[#6962AC]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6962AC] disabled:cursor-not-allowed disabled:opacity-40'
