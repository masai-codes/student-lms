import { PaperPlaneRight, Waveform } from '@phosphor-icons/react'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

const TEXTAREA_MIN_HEIGHT_PX = 24
const TEXTAREA_MAX_HEIGHT_PX = 120

type ChatbotComposerProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onVoiceActivate?: () => void
  isVoiceActive?: boolean
  placeholder?: string
  disabled?: boolean
  voiceDisabled?: boolean
  isSending?: boolean
  isConnecting?: boolean
  className?: string
}

export function ChatbotComposer({
  value,
  onChange,
  onSubmit,
  onVoiceActivate,
  isVoiceActive = false,
  placeholder = 'How can I help you today?',
  disabled = false,
  voiceDisabled = false,
  isSending = false,
  isConnecting = false,
  className,
}: ChatbotComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isMultiline, setIsMultiline] = useState(false)
  const hasText = value.trim().length > 0
  const isBusy = disabled || isSending || isConnecting
  const canSubmit = hasText && !isBusy
  const resolvedPlaceholder = isConnecting
    ? 'Connecting to assistant...'
    : placeholder

  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) {
      return
    }

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

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) {
      return
    }
    onSubmit()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || !canSubmit) {
      return
    }
    event.preventDefault()
    onSubmit()
  }

  const actionBtnClass =
    'flex size-9 cursor-pointer items-center justify-center rounded-full border-none transition-opacity disabled:cursor-not-allowed disabled:opacity-45'

  return (
    <form
      className={cn(
        'flex min-h-12 w-full gap-2 border border-gray-200 bg-white py-1.5 pr-2 pl-3.5 shadow-sm',
        isMultiline ? 'items-end rounded-2xl' : 'items-center rounded-full',
        className,
      )}
      onSubmit={handleSubmit}
    >
      <textarea
        ref={textareaRef}
        rows={1}
        className="min-h-6 min-w-0 flex-1 resize-none overflow-y-auto border-none bg-transparent py-2 text-sm leading-snug text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-70"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={resolvedPlaceholder}
        disabled={isBusy}
        aria-label="Ask about the lecture"
      />
      <div className="flex shrink-0 items-center gap-1 self-end">
        {hasText ? (
          <button
            type="submit"
            className={cn(actionBtnClass, 'bg-teal-700 text-white')}
            disabled={!canSubmit}
            aria-label="Send message"
          >
            <PaperPlaneRight className="size-[18px]" weight="fill" />
          </button>
        ) : onVoiceActivate ? (
          <button
            type="button"
            className={cn(
              actionBtnClass,
              isVoiceActive ? 'bg-teal-700 text-white' : 'bg-gray-900 text-white',
            )}
            onClick={onVoiceActivate}
            disabled={voiceDisabled}
            aria-label={isVoiceActive ? 'Switch to text chat' : 'Switch to voice chat'}
            aria-pressed={isVoiceActive}
          >
            <Waveform className="size-[18px]" weight="bold" />
          </button>
        ) : null}
      </div>
    </form>
  )
}
