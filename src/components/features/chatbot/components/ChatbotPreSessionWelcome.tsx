import type { ReactNode } from 'react'
import { AIAvatar } from '@/components/common/AIAvatar'
import { ChatbotPromptCards } from '@/components/features/chatbot/components/ChatbotPromptCards'
import { cn } from '@/lib/utils'

type ChatbotPreSessionWelcomeProps = {
  onPromptSelect: (prompt: string) => void
  promptsDisabled?: boolean
  composer: ReactNode
}

export function ChatbotPreSessionWelcome({
  composer,
  onPromptSelect,
  promptsDisabled = false,
}: ChatbotPreSessionWelcomeProps) {

  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col items-center overflow-hidden',
        'px-2 pb-2 pt-1',
      )}
    >
      <AIAvatar />

      <footer className="mt-auto flex w-full max-w-[520px] shrink-0 flex-col">
        <ChatbotPromptCards
          variant="welcome"
          onSelect={onPromptSelect}
          disabled={promptsDisabled}
        />
        <div className="flex w-full shrink-0 flex-col gap-2 pt-2">{composer}</div>
      </footer>
    </div>
  )
}
