'use client'

import { type RefObject } from 'react'
import { Microphone, PaperPlaneRight, Plus, Waveform } from '@phosphor-icons/react'

import { cn } from '@/lib/utils'

type LectureAiChatBarProps = {
  className?: string
  value: string
  onChange: (value: string) => void
  onFocus?: () => void
  onSend?: () => void
  isSending?: boolean
  inputRef?: RefObject<HTMLInputElement | null>
}

export function LectureAiChatBar({
  className,
  value,
  onChange,
  onFocus,
  onSend,
  isSending = false,
  inputRef,
}: LectureAiChatBarProps) {
  const canSend = value.trim().length > 0 && !isSending

  return (
    <div
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

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={event => onChange(event.target.value)}
        onFocus={onFocus}
        onKeyDown={event => {
          if (event.key === 'Enter' && !event.shiftKey && canSend) {
            event.preventDefault()
            onSend?.()
          }
        }}
        placeholder="Ask anything about the lecture"
        aria-label="Ask the AI tutor"
        className="type-b2-regular min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-gray-400"
      />

      <button
        type="button"
        onClick={onSend}
        disabled={!canSend}
        aria-label="Send message"
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full transition-colors',
          canSend
            ? 'bg-primary-600 text-white hover:bg-primary-700'
            : 'cursor-not-allowed bg-white/10 text-gray-500',
        )}
      >
        <PaperPlaneRight className="size-5" weight="fill" />
      </button>

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
