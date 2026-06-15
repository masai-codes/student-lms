import { CHATBOT_SAMPLE_PROMPTS } from '@/components/features/chatbot/constants/samplePrompts'
import { cn } from '@/lib/utils'

type ChatbotPromptCardsProps = {
  onSelect: (prompt: string) => void
  disabled?: boolean
  variant?: 'grid' | 'welcome'
}

export function ChatbotPromptCards({
  onSelect,
  disabled = false,
  variant = 'grid',
}: ChatbotPromptCardsProps) {
  const isWelcome = variant === 'welcome'
  const visiblePrompts = isWelcome
    ? CHATBOT_SAMPLE_PROMPTS.slice(0, 3)
    : CHATBOT_SAMPLE_PROMPTS

  return (
    <div
      className={cn(
        'w-full max-w-[520px]',
        isWelcome ? 'flex flex-col items-start gap-2' : 'grid grid-cols-1 gap-2 min-[480px]:grid-cols-2',
      )}
      role="list"
      aria-label="Suggested prompts"
    >
      {visiblePrompts.map((item) => {
        const Icon = item.icon

        return (
          <button
            key={item.id}
            type="button"
            role="listitem"
            className={cn(
              'cursor-pointer border text-left leading-snug text-gray-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60',
              isWelcome
                ? 'inline-flex  items-center gap-2 rounded-full border-gray-200 bg-white px-3.5 py-2.5 text-[12px] hover:border-teal-700 hover:bg-teal-50 disabled:hover:border-gray-200 disabled:hover:bg-white'
                : 'rounded-xl border-gray-200 bg-gray-50 p-3 text-[13px] hover:border-teal-700 hover:bg-teal-50 disabled:hover:border-gray-200 disabled:hover:bg-gray-50',
            )}
            disabled={disabled}
            onClick={() => onSelect(item.prompt)}
          >
            {isWelcome ? (
              <>
                <Icon
                  className={cn('size-4 shrink-0 text-gray-500', item.iconClassName)}
                  weight="bold"
                  aria-hidden
                />
                <span>{item.label}</span>
              </>
            ) : (
              item.label
            )}
          </button>
        )
      })}
    </div>
  )
}
