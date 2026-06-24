'use client'

import { ArrowSquareOut } from '@phosphor-icons/react'
import { useState } from 'react'

import type { JoinLiveButtonState } from '@/server/learn/utils/resolveJoinLiveButtonState'
import { fetchZoomRedirectUrlViaApi } from '@/lib/api/learn/zoomRedirectApi'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'

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

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-3 rounded-xl border border-border bg-background p-6 shadow-sm">
      <p className="type-b2-regular text-center text-gray-600">
        {isActive
          ? 'Your live session is ready. Join using the button below.'
          : 'The join button will activate shortly before the session starts.'}
      </p>
      {isActive && isNewZoomRedirection ? (
        <Button
          size="lg"
          className="w-full max-w-xs"
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
          className="w-full max-w-xs"
          disabled={!isActive}
        >
          {isActive ? (
            <a href={zoomLink} target="_blank" rel="noopener noreferrer">
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
