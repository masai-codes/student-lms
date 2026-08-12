import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { recordT0FlowStepComplete } from '@/lib/api/dashboard/dashboardApi'

/** A watch of ≥ this many seconds marks the video step complete (matches backend). */
const COMPLETION_THRESHOLD_SECONDS = 10

interface GuidedTourVideoStepProps {
  lectureId: number
  videoUrl: string | null
  batchId: number
  tab: 'lms' | 'program'
  /** Called after the step is first reported complete, so the caller can refetch progress. */
  onReported: () => void
  /** Total video steps in this tab + which one is active — drives the segment bar. */
  videoCount: number
  videoIndex: number
  /** Autoplay on mount — set when the previous video auto-advanced to this one. */
  autoPlay?: boolean
  /** Fired when the video reaches the end (drives auto-advance to the next video). */
  onEnded: () => void
}

/**
 * Plays a guided-tour walkthrough video (native player, so it matches every
 * other video surface) with a segmented progress bar across the tab's videos.
 * Reports completion once the learner has watched at least
 * {@link COMPLETION_THRESHOLD_SECONDS} — at most once per mount. Navigation
 * between steps is via the step list / auto-advance, so there's no Back/Next here.
 */
export function GuidedTourVideoStep({
  lectureId,
  videoUrl,
  batchId,
  tab,
  onReported,
  videoCount,
  videoIndex,
  autoPlay = false,
  onEnded,
}: GuidedTourVideoStepProps) {
  const [reported, setReported] = useState(false)
  const [progress, setProgress] = useState(0)

  const mutation = useMutation({
    mutationFn: (watchedSeconds: number) =>
      recordT0FlowStepComplete(lectureId, batchId, tab, watchedSeconds),
    onSuccess: onReported,
  })

  const handleTimeUpdate = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const { currentTime, duration } = event.currentTarget
    if (duration > 0) setProgress(Math.min(100, (currentTime / duration) * 100))
    if (!reported && currentTime >= COMPLETION_THRESHOLD_SECONDS) {
      setReported(true)
      mutation.mutate(Math.round(currentTime))
    }
  }

  if (!videoUrl) {
    return (
      <div
        className="flex aspect-video w-full items-center justify-center rounded-2xl bg-surface-muted text-sm text-foreground-muted"
        data-testid="guided-tour-video"
      >
        <span data-testid="guided-tour-video-missing">
          This video isn’t available yet.
        </span>
      </div>
    )
  }

  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black shadow-sm"
      data-testid="guided-tour-video"
    >
      {videoCount > 1 ? (
        <div
          className="absolute inset-x-0 top-0 z-10 flex gap-1.5 bg-gradient-to-b from-black/60 to-transparent p-3 pt-4"
          data-testid="guided-tour-video-segments"
        >
          {Array.from({ length: videoCount }, (_, i) => {
            const fill = i < videoIndex ? 100 : i === videoIndex ? progress : 0
            return (
              <div
                key={i}
                // Constant white — the segments overlay the black video well in both themes.
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/30"
              >
                <div
                  className="h-full bg-white transition-all duration-100 ease-linear"
                  style={{ width: `${fill}%` }}
                />
              </div>
            )
          })}
        </div>
      ) : null}
      <video
        key={lectureId}
        src={videoUrl}
        className="h-full w-full object-contain"
        controls
        playsInline
        autoPlay={autoPlay}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onEnded}
        suppressHydrationWarning
      />
    </div>
  )
}
