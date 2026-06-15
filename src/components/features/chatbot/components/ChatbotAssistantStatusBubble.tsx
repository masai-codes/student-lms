import { cn } from '@/lib/utils'

type ChatbotAssistantStatusBubbleProps = {
  label: string
  centered?: boolean
}

const dotClass =
  'size-1.5 animate-bounce rounded-full bg-gray-400 [animation-duration:900ms]'

export function ChatbotAssistantStatusBubble({
  label,
  centered = false,
}: ChatbotAssistantStatusBubbleProps) {
  return (
    <div
      className={cn(
        'flex max-w-[85%] items-center gap-2 rounded-[10px] bg-gray-100 px-3 py-2.5',
        centered ? 'self-center' : 'self-start',
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="flex items-center gap-1" aria-hidden>
        <span className={cn(dotClass, '[animation-delay:0ms]')} />
        <span className={cn(dotClass, '[animation-delay:150ms]')} />
        <span className={cn(dotClass, '[animation-delay:300ms]')} />
      </div>
      <span className="text-[13px] leading-snug text-gray-600">{label}</span>
    </div>
  )
}
