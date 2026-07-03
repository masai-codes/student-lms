import { useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  VideoPlayer,
  VideoPlayerContent,
  VideoPlayerControlBar,
  VideoPlayerMuteButton,
  VideoPlayerPlayButton,
  VideoPlayerTimeDisplay,
  VideoPlayerTimeRange,
  VideoPlayerVolumeRange,
} from '@/components/ui/video-player'
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
}

/**
 * Plays a guided-tour walkthrough video and reports completion once the learner
 * has watched at least {@link COMPLETION_THRESHOLD_SECONDS}. Reports at most once
 * per mount (guarded by a ref) and again is harmless/idempotent on the backend.
 */
export function GuidedTourVideoStep({ lectureId, videoUrl, batchId, tab, onReported }: GuidedTourVideoStepProps) {
  const reportedRef = useRef(false)

  const mutation = useMutation({
    mutationFn: (watchedSeconds: number) => recordT0FlowStepComplete(lectureId, batchId, tab, watchedSeconds),
    onSuccess: onReported,
  })

  const handleTimeUpdate = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const watched = event.currentTarget.currentTime
    if (!reportedRef.current && watched >= COMPLETION_THRESHOLD_SECONDS) {
      reportedRef.current = true
      mutation.mutate(Math.round(watched))
    }
  }

  if (!videoUrl) {
    return (
      <div
        className="flex h-48 items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-500"
        data-testid="guided-tour-video-missing"
      >
        This video isn’t available yet.
      </div>
    )
  }

  return (
    <VideoPlayer className="overflow-hidden rounded-xl border border-gray-200" data-testid="guided-tour-video">
      <VideoPlayerContent
        slot="media"
        src={videoUrl}
        onTimeUpdate={handleTimeUpdate}
        suppressHydrationWarning
      />
      <VideoPlayerControlBar>
        <VideoPlayerPlayButton />
        <VideoPlayerTimeRange />
        <VideoPlayerTimeDisplay showDuration />
        <VideoPlayerMuteButton />
        <VideoPlayerVolumeRange />
      </VideoPlayerControlBar>
    </VideoPlayer>
  )
}
