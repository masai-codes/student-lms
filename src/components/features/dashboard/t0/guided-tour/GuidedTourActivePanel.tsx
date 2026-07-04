import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { GuidedTourVideoStep } from './GuidedTourVideoStep'
import { GuidedTourStepPanel } from './GuidedTourStepPanel'
import type { GuidedTourStep } from './steps'

interface GuidedTourActivePanelProps {
  step: GuidedTourStep | undefined
  batchId: number
  tab: 'lms' | 'program'
  idCardUrl: string | null
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
  onReported,
  onBack,
  onNext,
  canBack,
  canNext,
}: GuidedTourActivePanelProps) {
  if (!step) return null

  return (
    <div className="flex h-full flex-col gap-4" data-testid="guided-tour-active-panel">
      <h2 className="text-center text-lg font-semibold text-gray-900" data-testid="guided-tour-active-title">
        {step.title}
      </h2>

      <div className="flex-1">
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
          <GuidedTourStepPanel step={step} idCardUrl={idCardUrl} onCompleted={onReported} />
        )}
      </div>

      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} disabled={!canBack} className={NAV_BTN} data-testid="guided-tour-back">
          <ArrowLeft className="size-4" aria-hidden />
          Back
        </button>
        <button type="button" onClick={onNext} disabled={!canNext} className={NAV_BTN} data-testid="guided-tour-next">
          Next
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}

const NAV_BTN =
  'inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40'
