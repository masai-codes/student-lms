'use client'

import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { Microphone, PaperPlaneRight, Plus, Waveform } from '@phosphor-icons/react'
import type { RefObject } from 'react'

import { cn } from '@/lib/utils'

import './lectureAiChatBar.css'

const TEXTAREA_LINE_HEIGHT_PX = 22
const TEXTAREA_MIN_HEIGHT_PX = 24
const TEXTAREA_MAX_HEIGHT_PX = TEXTAREA_LINE_HEIGHT_PX * 5

type LectureAiChatBarProps = {
  className?: string
  value: string
  onChange: (value: string) => void
  onFocus?: () => void
  onBlur?: () => void
  onSend?: () => void
  isSending?: boolean
  inputRef?: RefObject<HTMLTextAreaElement | null>
}

function mergeRefs<T>(
  ...refs: Array<RefObject<T | null> | ((instance: T | null) => void) | null>
) {
  return (instance: T | null) => {
    for (const ref of refs) {
      if (!ref) continue
      if (typeof ref === 'function') ref(instance)
      else ref.current = instance
    }
  }
}

export function LectureAiChatBar({
  className,
  value,
  onChange,
  onFocus,
  onBlur,
  onSend,
  isSending = false,
  inputRef,
}: LectureAiChatBarProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [isMultiline, setIsMultiline] = useState(false)
  const localTextareaRef = useRef<HTMLTextAreaElement>(null)
  const canSend = value.trim().length > 0 && !isSending

  const resizeTextarea = useCallback(() => {
    const textarea = localTextareaRef.current
    if (!textarea) return

    textarea.style.height = '0'
    const nextHeight = Math.min(
      Math.max(textarea.scrollHeight, TEXTAREA_MIN_HEIGHT_PX),
      TEXTAREA_MAX_HEIGHT_PX,
    )
    textarea.style.height = `${nextHeight}px`
    setIsMultiline(
      value.includes('\n') || nextHeight > TEXTAREA_MIN_HEIGHT_PX + 4,
    )
  }, [value])

  useLayoutEffect(() => {
    resizeTextarea()
  }, [resizeTextarea])

  const roundedClass = isMultiline ? 'rounded-[1.25rem]' : 'rounded-full'

  return (
    <div
      className={cn(
        'lecture-chat-bar-shine',
        roundedClass,
        isFocused && 'lecture-chat-bar-shine--focused',
        className,
      )}
    >
      <div
        className={cn(
          'lecture-chat-bar-shine__inner',
          isMultiline && 'lecture-chat-bar-shine__inner--multiline',
          roundedClass,
        )}
      >
        <button
          type="button"
          aria-label="Add attachment"
          className="mb-0.5 flex size-9 shrink-0 items-center justify-center self-end rounded-full text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Plus className="size-5" weight="bold" />
        </button>

        <textarea
          ref={inputRef ? mergeRefs(localTextareaRef, inputRef) : localTextareaRef}
          rows={1}
          value={value}
          onChange={event => onChange(event.target.value)}
          onFocus={() => {
            setIsFocused(true)
            onFocus?.()
          }}
          onBlur={() => {
            setIsFocused(false)
            onBlur?.()
          }}
          onKeyDown={event => {
            if (event.key !== 'Enter') return
            if (event.shiftKey) return
            event.preventDefault()
            if (canSend) onSend?.()
          }}
          placeholder="Ask anything..."
          aria-label="Ask the AI tutor"
          className="type-b2-regular max-h-[7.5rem] min-h-6 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent py-1.5 text-white outline-none placeholder:text-gray-400"
        />

        <div className="flex shrink-0 items-center gap-0.5 self-end">
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            aria-label="Send message"
            className={cn(
              'flex size-9 items-center justify-center rounded-full transition-colors',
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
            className="flex size-9 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Microphone className="size-5" weight="fill" />
          </button>

          <button
            type="button"
            aria-label="Audio chat"
            className="flex size-9 items-center justify-center rounded-full bg-white text-[#2f2f2f] shadow-sm transition-opacity hover:opacity-90"
          >
            <Waveform className="size-5" weight="bold" />
          </button>
        </div>
      </div>
    </div>
  )
}
