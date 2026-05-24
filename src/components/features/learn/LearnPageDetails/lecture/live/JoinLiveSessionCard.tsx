'use client'

import { ArrowSquareOut } from '@phosphor-icons/react'

import type { JoinLiveButtonState } from '@/server/learn/utils/resolveJoinLiveButtonState'
import { Button } from '@/components/ui/button'

type JoinLiveSessionCardProps = {
  zoomLink: string
  buttonState: JoinLiveButtonState
}

export function JoinLiveSessionCard({
  zoomLink,
  buttonState,
}: JoinLiveSessionCardProps) {
  if (buttonState === 'hidden') {
    return null
  }

  const isActive = buttonState === 'active'

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-3 rounded-xl border border-border bg-background p-6 shadow-sm">
      <p className="type-b2-regular text-center text-gray-600">
        {isActive
          ? 'Your live session is ready. Join using the button below.'
          : 'The join button will activate shortly before the session starts.'}
      </p>
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
    </div>
  )
}
