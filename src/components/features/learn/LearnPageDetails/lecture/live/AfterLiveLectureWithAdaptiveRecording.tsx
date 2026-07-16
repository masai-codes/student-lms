'use client'

import { ArrowSquareOut } from '@phosphor-icons/react'

import { LectureStatePanel } from '../shared/LectureStatePanel'
import { Button } from '@/components/ui/button'
import {
  learnEntityEvent,
  pushLearnEvent,
} from '@/components/features/learn/shared/learnAnalytics'

type AfterLiveLectureWithAdaptiveRecordingProps = {
  lectureId: number
  /**
   * Lecture-scoped adaptive join link. Once the meeting has ended, the
   * experience-api handler redirects it to the recording, so opening it in a
   * new tab lands the student on the SAL recording player.
   */
  recordingUrl: string
}

export function AfterLiveLectureWithAdaptiveRecording({
  lectureId,
  recordingUrl,
}: AfterLiveLectureWithAdaptiveRecordingProps) {
  return (
    <LectureStatePanel
      icon="video"
      title="Watch the recording"
      description="This live lecture has ended. Its recording is available on the lecture platform and opens in a new tab."
      action={
        <Button
          asChild
          size="lg"
          className="w-full max-w-xs shadow-lg shadow-[#4F6BED]/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#4F6BED]/35 active:translate-y-0 active:scale-[0.98]"
        >
          <a
            href={recordingUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              pushLearnEvent(
                learnEntityEvent('lecture', 'watch_recording_click', lectureId),
                { lecture_id: lectureId },
              )
            }
          >
            Watch Recording
            <ArrowSquareOut className="ml-2 size-4" aria-hidden />
          </a>
        </Button>
      }
    />
  )
}
