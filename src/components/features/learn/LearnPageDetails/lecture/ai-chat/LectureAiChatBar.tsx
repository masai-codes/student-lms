'use client'

import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import {
  CircleNotch,
  Microphone,
  MicrophoneSlash,
  PaperPlaneRight,
} from '@phosphor-icons/react'
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
  onMicToggle?: () => void
  isSending?: boolean
  isMicEnabled?: boolean
  isMicPending?: boolean
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
  onMicToggle,
  isSending = false,
  isMicEnabled = false,
  isMicPending = false,
  inputRef,
}: LectureAiChatBarProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [isMultiline, setIsMultiline] = useState(false)
  const localTextareaRef = useRef<HTMLTextAreaElement>(null)
  const hasText = value.trim().length > 0
  const canSend = hasText && !isSending

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

  const renderMicButton = () => {
    const showSpinner = isMicPending
    const baseClasses =
      'flex size-9 items-center justify-center rounded-full transition-colors'
    const stateClasses = isMicEnabled
      ? 'lecture-chat-mic-pulse bg-danger text-white hover:bg-red-600'
      : 'bg-surface text-[#2f2f2f] shadow-sm hover:opacity-90 dark:text-foreground'

    return (
      <button
        type="button"
        onClick={onMicToggle}
        disabled={showSpinner}
        aria-label={isMicEnabled ? 'Stop voice chat' : 'Start voice chat'}
        aria-pressed={isMicEnabled}
        className={cn(baseClasses, stateClasses)}
      >
        {showSpinner ? (
          <CircleNotch className="size-5 animate-spin" weight="bold" />
        ) : isMicEnabled ? (
          <MicrophoneSlash className="size-5" weight="fill" />
        ) : (
          <Microphone className="size-5" weight="fill" />
        )}
      </button>
    )
  }

  const renderPrimaryAction = () => {
    if (hasText) {
      return (
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          aria-label="Send message"
          className={cn(
            'flex size-9 items-center justify-center rounded-full transition-colors',
            canSend
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'cursor-not-allowed bg-surface/10 text-foreground-muted',
          )}
        >
          <PaperPlaneRight className="size-5" weight="fill" />
        </button>
      )
    }

    return renderMicButton()
  }

  return (
    <div
      className={cn(
        'lecture-chat-bar-shine',
        roundedClass,
        isFocused && 'lecture-chat-bar-shine--focused',
        isMicEnabled && 'lecture-chat-bar-shine--listening',
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
        <textarea
          ref={
            inputRef ? mergeRefs(localTextareaRef, inputRef) : localTextareaRef
          }
          rows={1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => {
            setIsFocused(true)
            onFocus?.()
          }}
          onBlur={() => {
            setIsFocused(false)
            onBlur?.()
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            if (event.shiftKey) return
            event.preventDefault()
            if (canSend) onSend?.()
          }}
          placeholder={
            isMicEnabled
              ? 'Listening… speak or type to respond'
              : 'Ask anything...'
          }
          aria-label="Ask the AI tutor"
          className="type-b2-regular max-h-[7.5rem] min-h-6 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent py-1.5 text-white outline-none placeholder:text-foreground-subtle"
        />

        <div className="flex shrink-0 items-center gap-0.5 self-end">
          {renderPrimaryAction()}
        </div>
      </div>
    </div>
  )
}
