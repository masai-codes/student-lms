import { useVoiceSubtitleViewport } from '@/components/features/chatbot/hooks/useVoiceSubtitleViewport'
import type { VoiceSubtitle } from '@/components/features/chatbot/utils/voiceSubtitle'
import { cn } from '@/lib/utils'

const SUBTITLE_SLOT_HEIGHT = 'h-[7.5rem]'

type ChatbotVoiceSubtitleProps = {
  subtitle: VoiceSubtitle | null
}

export function ChatbotVoiceSubtitle({ subtitle }: ChatbotVoiceSubtitleProps) {
  const text = subtitle?.text ?? ''
  const streamId = subtitle?.streamId ?? ''
  const { textRef, displayText } = useVoiceSubtitleViewport(text, streamId)

  if (!subtitle) {
    return <div className={cn(SUBTITLE_SLOT_HEIGHT, 'shrink-0')} aria-hidden />
  }

  return (
    <div
      className={cn(
        'flex w-full shrink-0 items-end justify-center px-3 pb-2',
        SUBTITLE_SLOT_HEIGHT,
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="max-h-full max-w-[92%] overflow-hidden">
        <p
          ref={textRef}
          className={cn(
            'm-0 rounded-xl px-4 py-2.5 text-center type-b2-md leading-relaxed',
            'transition-opacity duration-200',
            subtitle.role === 'user'
              ? 'bg-primary-600/90 text-white'
              : 'bg-gray-900/80 text-white',
          )}
        >
          {displayText}
        </p>
      </div>
    </div>
  )
}
