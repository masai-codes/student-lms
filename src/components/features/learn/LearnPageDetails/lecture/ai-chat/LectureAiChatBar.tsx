'use client'

import { Microphone, Plus, Waveform } from '@phosphor-icons/react'

import { cn } from '@/lib/utils'

type LectureAiChatBarProps = {
  className?: string
}

/** Static ChatGPT-style input shell; wiring comes later. */
export function LectureAiChatBar({ className }: LectureAiChatBarProps) {
  return (
    <div
      role="search"
      aria-label="AI lecture assistant"
      className={cn(
        'flex h-12 w-full items-center gap-2 rounded-full bg-[#2f2f2f] px-3 shadow-[0_2px_12px_rgba(0,0,0,0.18)]',
        'ring-1 ring-white/10',
        className,
      )}
    >
      <button
        type="button"
        aria-label="Add attachment"
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Plus className="size-5" weight="bold" />
      </button>

      <p className="type-b2-regular min-w-0 flex-1 truncate text-left text-gray-400">
        Ask anything
      </p>

      <button
        type="button"
        aria-label="Voice input"
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Microphone className="size-5" weight="fill" />
      </button>

      <button
        type="button"
        aria-label="Audio chat"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-[#2f2f2f] shadow-sm transition-opacity hover:opacity-90"
      >
        <Waveform className="size-5" weight="bold" />
      </button>
    </div>
  )
}
