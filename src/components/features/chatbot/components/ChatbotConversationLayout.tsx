import type { ReactNode } from 'react'
import type { DisplayMessage } from '@/components/features/chatbot/types'
import { MessageList } from '@/components/features/chatbot/components/MessageList'
import { cn } from '@/lib/utils'

type ChatbotConversationLayoutProps = {
  messages: Array<DisplayMessage>
  emptyLabel?: string
  assistantStatusLabel?: string | null
  composer: ReactNode
}

export function ChatbotConversationLayout({
  messages,
  emptyLabel,
  assistantStatusLabel = null,
  composer,
}: ChatbotConversationLayoutProps) {

  return (
    <section
      className={cn(
        'flex min-h-0 flex-1 flex-col',
        'p-2',
      )}
      aria-label="Lecture assistant"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <MessageList
          messages={messages}
          emptyLabel={emptyLabel}
          assistantStatusLabel={assistantStatusLabel}
        />
      </div>
      <footer className="flex shrink-0 flex-col gap-2 pt-2 mb-2">{composer}</footer>
    </section>
  )
}
