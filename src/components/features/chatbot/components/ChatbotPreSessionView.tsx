import { useState } from 'react'
import { ChatbotComposer } from '@/components/features/chatbot/components/ChatbotComposer'
import { ChatbotConversationLayout } from '@/components/features/chatbot/components/ChatbotConversationLayout'
import { ChatbotPreSessionWelcome } from '@/components/features/chatbot/components/ChatbotPreSessionWelcome'
import type { DisplayMessage } from '@/components/features/chatbot/types'
import { cn } from '@/lib/utils'

type ChatbotPreSessionViewProps = {
  optimisticMessages: DisplayMessage[]
  onStartWithText: (text: string) => void | Promise<void>
  onStartWithVoice: () => void | Promise<void>
  isCreating?: boolean
}

export function ChatbotPreSessionView({
  optimisticMessages,
  onStartWithText,
  onStartWithVoice,
  isCreating = false,
}: ChatbotPreSessionViewProps) {
  const [input, setInput] = useState('')

  const handleSubmit = () => {
    const text = input.trim()
    if (!text || isCreating) {
      return
    }
    setInput('')
    void onStartWithText(text)
  }

  const handlePromptSelect = (prompt: string) => {
    if (isCreating) {
      return
    }
    void onStartWithText(prompt)
  }

  const showWelcome = optimisticMessages.length === 0
  const assistantStatusLabel =
    isCreating && optimisticMessages.length > 0 ? 'Connecting to assistant...' : null

  const composer = (
    <ChatbotComposer
      value={input}
      onChange={setInput}
      onSubmit={handleSubmit}
      onVoiceActivate={() => void onStartWithVoice()}
      disabled={isCreating}
      isConnecting={isCreating}
      placeholder="How can I help you today?"
    />
  )

  if (showWelcome) {
    return (
      <section
        className={cn(
          'flex min-h-0 flex-1 flex-col',
          'p-2',
        )}
        aria-label="Lecture assistant"
      >
        <ChatbotPreSessionWelcome
          onPromptSelect={handlePromptSelect}
          promptsDisabled={isCreating}
          composer={composer}
        />
      </section>
    )
  }
  return (
    <ChatbotConversationLayout
      messages={optimisticMessages}
      emptyLabel="Ask a question about the lecture."
      assistantStatusLabel={assistantStatusLabel}
      composer={composer}
    />
  )
}
