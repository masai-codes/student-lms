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
}

/**
 * Right panel of the guided tour: the active step's centred title and its
 * content (video player for video steps, else the fixed-step panel). There's no
 * Back/Next here — steps are navigated from the left step list (and videos
 * auto-advance); the agreement runs its own multi-step flow.
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
          card; on mobile the page scrolls naturally. */}
      <div className="mt-3 min-w-0 flex-1 px-4 pb-6 md:mt-4 md:px-6 md:min-h-0 md:overflow-y-auto">
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
      </div>
    </div>
  )
}
