'use client'

import { ArrowSquareOut, MicrophoneSlash } from '@phosphor-icons/react'
import { useState } from 'react'

import type { JoinLiveButtonState } from '@/server/learn/utils/resolveJoinLiveButtonState'
import { fetchZoomRedirectUrlViaApi } from '@/lib/api/learn/zoomRedirectApi'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'
import {
  learnEntityEvent,
  pushLearnEvent,
} from '@/components/features/learn/shared/learnAnalytics'

type JoinLiveSessionCardProps = {
  lectureId: number
  zoomLink: string
  buttonState: JoinLiveButtonState
  /** When true, join via the ZEF redirect flow instead of the raw zoom link. */
  isNewZoomRedirection: boolean
}

function openInNewTab(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function JoinLiveSessionCard({
  lectureId,
  zoomLink,
  buttonState,
  isNewZoomRedirection,
}: JoinLiveSessionCardProps) {
  const [pending, setPending] = useState(false)

  if (buttonState === 'hidden') {
    return null
  }

  const isActive = buttonState === 'active'

  const handleZefJoin = async () => {
    if (pending) return
    pushLearnEvent(learnEntityEvent('lecture', 'join_live_click', lectureId), {
      lecture_id: lectureId,
    })
    setPending(true)
    try {
      openInNewTab(await fetchZoomRedirectUrlViaApi(lectureId))
    } catch {
      // Fall back to the raw link so the student can still join.
      openInNewTab(zoomLink)
      toast.error('Opened the standard join link instead.')
    } finally {
      setPending(false)
    }
  }

  // Glow + lift + press physics for the enabled join CTA.
  const joinCtaClasses =
    'w-full max-w-xs shadow-lg shadow-[#4F6BED]/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#4F6BED]/35 active:translate-y-0 active:scale-[0.98]'

  return (
    <div className="dash-lift animate-dash-rise mx-auto flex w-full max-w-lg flex-col items-center gap-3 rounded-xl border border-border bg-background p-6 shadow-sm hover:border-brand/35">
      <p className="type-b2-regular text-center text-foreground-muted">
        {isActive
          ? 'Your live session link is ready. Join using the button below.'
          : 'The join button will activate shortly before the session starts.'}
      </p>
      {isActive && (
        <div className="flex w-fit max-w-full items-start gap-2 rounded-lg border border-warning-subtle bg-warning-subtle px-3 py-2.5 text-warning-subtle-foreground">
          <MicrophoneSlash
            weight="fill"
            className="mt-0.5 size-4 shrink-0"
            aria-hidden
          />
          <p className="min-w-0 break-words text-sm">
            Please mute your microphone when joining the lecture.
          </p>
        </div>
      )}
      {isActive && isNewZoomRedirection ? (
        <Button
          size="lg"
          className={joinCtaClasses}
          disabled={pending}
          onClick={handleZefJoin}
        >
          {pending ? 'Opening…' : 'Join live session'}
          <ArrowSquareOut className="ml-2 size-4" aria-hidden />
        </Button>
      ) : (
        <Button
          asChild={isActive}
          size="lg"
          className={isActive ? joinCtaClasses : 'w-full max-w-xs'}
          disabled={!isActive}
        >
          {isActive ? (
            <a
              href={zoomLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                pushLearnEvent(
                  learnEntityEvent('lecture', 'join_live_click', lectureId),
                  { lecture_id: lectureId },
                )
              }
            >
              Join live session
              <ArrowSquareOut className="ml-2 size-4" aria-hidden />
            </a>
          ) : (
            <span>Join live session</span>
          )}
        </Button>
      )}
    </div>
  )
}
