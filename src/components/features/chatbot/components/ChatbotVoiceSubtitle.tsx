import type { VoiceSubtitle } from '@/components/features/chatbot/utils/voiceSubtitle'
import { cn } from '@/lib/utils'

type ChatbotVoiceSubtitleProps = {
  subtitle: VoiceSubtitle | null
}

export function ChatbotVoiceSubtitle({ subtitle }: ChatbotVoiceSubtitleProps) {
  if (!subtitle) {
    return null
  }

  return (
    <div
      className="flex w-full items-center justify-center px-3 pb-2"
      aria-live="polite"
      aria-atomic="true"
    >
      <p
        className={cn(
          'max-w-[92%] rounded-xl px-4 py-2.5 text-center type-b2-md leading-relaxed',
          'transition-opacity duration-200',
          subtitle.role === 'user'
            ? 'bg-primary-600/90 text-white'
            : 'bg-gray-900/80 text-white',
        )}
      >
        {subtitle.text}
      </p>
    </div>
  )
}
