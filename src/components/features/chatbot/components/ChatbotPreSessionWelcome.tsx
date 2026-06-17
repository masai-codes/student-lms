import { Sparkle } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { ChatbotPromptCards } from '@/components/features/chatbot/components/ChatbotPromptCards'

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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-2 pt-3">
      <div className="flex flex-1 flex-col gap-3">
        <Sparkle className="size-5 text-gray-900" weight="fill" aria-hidden />
        <p className="text-sm leading-relaxed text-gray-900">
          Hello! Have questions about this lecture? I&apos;m here to help you learn.
        </p>
        <p className="text-sm text-gray-700">Not sure what to ask? Choose something:</p>
        <ChatbotPromptCards
          variant="welcome"
          onSelect={onPromptSelect}
          disabled={promptsDisabled}
        />
      </div>

      <footer className="mt-auto flex w-full shrink-0 flex-col gap-2 border-t border-gray-100 pt-3">
        <p className="text-center text-[11px] leading-snug text-gray-500">
          AI can make mistakes, so double-check it.
        </p>
        {composer}
      </footer>
    </div>
  )
}
