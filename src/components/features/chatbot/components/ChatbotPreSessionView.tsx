import { useState } from 'react'
import type { DisplayMessage } from '@/components/features/chatbot/types'
import { ChatbotComposer } from '@/components/features/chatbot/components/ChatbotComposer'
import { ChatbotConversationLayout } from '@/components/features/chatbot/components/ChatbotConversationLayout'
import { ChatbotPreSessionWelcome } from '@/components/features/chatbot/components/ChatbotPreSessionWelcome'

type ChatbotPreSessionViewProps = {
  optimisticMessages: Array<DisplayMessage>
  onStartWithText: (text: string) => void | Promise<void>
  onStartWithVoice: () => void | Promise<void>
  isCreating?: boolean
  layout?: 'default' | 'composerOnly'
}

export function ChatbotPreSessionView({
  optimisticMessages,
  onStartWithText,
  onStartWithVoice,
  isCreating = false,
  layout = 'default',
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
      placeholder="Ask a question..."
    />
  )

  if (layout === 'composerOnly' && showWelcome) {
    return composer
  }

  if (showWelcome) {
    return (
      <section
        className="flex min-h-0 flex-1 flex-col"
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
