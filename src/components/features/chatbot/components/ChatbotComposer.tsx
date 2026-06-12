import { PaperPlaneRight, Waveform } from '@phosphor-icons/react'
import type { FormEvent, KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

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
}: ChatbotComposerProps) {
  const hasText = value.trim().length > 0
  const isBusy = disabled || isSending || isConnecting
  const canSubmit = hasText && !isBusy
  const resolvedPlaceholder = isConnecting
    ? 'Connecting to assistant...'
    : placeholder

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) {
      return
    }
    onSubmit()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
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
      className="flex min-h-12 w-full items-center gap-2 rounded-full border border-gray-300 bg-white py-1.5 pr-2 pl-3.5"
      onSubmit={handleSubmit}
    >
      <input
        type="text"
        className="min-w-0 flex-1 border-none bg-transparent py-2 text-sm leading-snug text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-70"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={resolvedPlaceholder}
        disabled={isBusy}
        aria-label="Ask about the lecture"
      />
      <div className="flex shrink-0 items-center gap-1">
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
