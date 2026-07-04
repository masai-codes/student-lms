import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { GuidedTourVideoStep } from './GuidedTourVideoStep'
import { GuidedTourStepPanel } from './GuidedTourStepPanel'
import type { GuidedTourStep } from './steps'

interface GuidedTourActivePanelProps {
  step: GuidedTourStep | undefined
  batchId: number
  tab: 'lms' | 'program'
  idCardUrl: string | null
  profilePhotoUrl: string | null
  onReported: () => void
  onBack: () => void
  onNext: () => void
  canBack: boolean
  canNext: boolean
}

/**
 * Right panel of the guided tour: the active step's centred title, its content
 * (video player for video steps, else the fixed-step panel), and Back / Next
 * navigation across the current tab's steps.
 */
export function GuidedTourActivePanel({
  step,
  batchId,
  tab,
  idCardUrl,
  profilePhotoUrl,
  onReported,
  onBack,
  onNext,
  canBack,
  canNext,
}: GuidedTourActivePanelProps) {
  if (!step) return null

  // The agreement runs its own multi-step flow with its own action bar, so the
  // tour's Back/Next is hidden there (the step list still lets you jump around).
  const ownsNavigation = step.action === 'agreement'

  return (
    <div className="flex h-full min-w-0 flex-col" data-testid="guided-tour-active-panel">
      <h2 className="shrink-0 px-6 pt-6 text-center text-lg font-semibold text-gray-900" data-testid="guided-tour-active-title">
        {step.title}
      </h2>

      {/* On desktop only this region scrolls, so the panel never overflows its
          card; on mobile the page scrolls naturally. */}
      <div className="mt-4 min-w-0 flex-1 px-6 pb-6 md:min-h-0 md:overflow-y-auto">
        {step.kind === 'video' && step.video ? (
          <GuidedTourVideoStep
            key={step.key}
            lectureId={step.video.lectureId}
            videoUrl={step.video.videoUrl}
            batchId={batchId}
            tab={tab}
            onReported={onReported}
          />
        ) : (
          <GuidedTourStepPanel step={step} idCardUrl={idCardUrl} profilePhotoUrl={profilePhotoUrl} onCompleted={onReported} />
        )}
      </div>

      {ownsNavigation ? null : (
        <div className="flex shrink-0 items-center justify-between border-t border-gray-100 px-6 py-3">
          <button type="button" onClick={onBack} disabled={!canBack} className={NAV_BTN} data-testid="guided-tour-back">
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </button>
          <button type="button" onClick={onNext} disabled={!canNext} className={NAV_BTN} data-testid="guided-tour-next">
            Next
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  )
}

const NAV_BTN =
  'inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40'
