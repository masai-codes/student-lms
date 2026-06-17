import type { ReactNode } from 'react'
import { ChatbotMobileDrawer } from '@/components/features/chatbot/components/ChatbotMobileDrawer'
import { ChatbotPreSessionView } from '@/components/features/chatbot/components/ChatbotPreSessionView'
import { ChatbotComposer } from '@/components/features/chatbot/components/ChatbotComposer'
import {
  chatbotErrorBannerClass,
  chatbotMainClass,
  chatbotMobileDrawerBodyClass,
  chatbotShellClass,
} from '@/components/features/chatbot/chatbotUi'
import type { DisplayMessage } from '@/components/features/chatbot/types'
import { cn } from '@/lib/utils'
import { useState } from 'react'

type ChatbotMobileShellProps = {
  isDrawerOpen: boolean
  onDrawerOpenChange: (open: boolean) => void
  loadError: string | null
  activeSessionId: string | null
  optimisticMessages: DisplayMessage[]
  isCreatingSession: boolean
  onStartWithText: (text: string) => void | Promise<void>
  onStartWithVoice: () => void | Promise<void>
  onInlineSend: (text: string) => void
  drawerContent: ReactNode
}

function ChatbotMobileInlineComposer({
  onSubmit,
  onVoiceActivate,
  disabled,
}: {
  onSubmit: (text: string) => void
  onVoiceActivate: () => void
  disabled?: boolean
}) {
  const [input, setInput] = useState('')

  const handleSubmit = () => {
    const text = input.trim()
    if (!text || disabled) {
      return
    }
    setInput('')
    onSubmit(text)
  }

  return (
    <ChatbotComposer
      value={input}
      onChange={setInput}
      onSubmit={handleSubmit}
      onVoiceActivate={onVoiceActivate}
      disabled={disabled}
      placeholder="Ask a question..."
    />
  )
}

export function ChatbotMobileShell({
  isDrawerOpen,
  onDrawerOpenChange,
  loadError,
  activeSessionId,
  optimisticMessages,
  isCreatingSession,
  onStartWithText,
  onStartWithVoice,
  onInlineSend,
  drawerContent,
}: ChatbotMobileShellProps) {
  const showInlineComposer = !isDrawerOpen

  return (
    <div className={chatbotShellClass}>
      <main className={cn(chatbotMainClass, 'flex min-h-0 flex-col')}>
        {loadError && !isDrawerOpen ? (
          <div className={cn(chatbotErrorBannerClass, 'mx-2 mt-2 shrink-0')}>{loadError}</div>
        ) : null}

        {showInlineComposer && !activeSessionId ? (
          <div className="shrink-0 p-2">
            <ChatbotPreSessionView
              layout="composerOnly"
              optimisticMessages={optimisticMessages}
              onStartWithText={onStartWithText}
              onStartWithVoice={onStartWithVoice}
              isCreating={isCreatingSession}
            />
          </div>
        ) : null}

        {showInlineComposer && activeSessionId ? (
          <div className="shrink-0 p-2">
            <ChatbotMobileInlineComposer
              onSubmit={onInlineSend}
              onVoiceActivate={() => onDrawerOpenChange(true)}
              disabled={isCreatingSession}
            />
          </div>
        ) : null}

        {isDrawerOpen || activeSessionId ? (
          <ChatbotMobileDrawer open={isDrawerOpen} onOpenChange={onDrawerOpenChange}>
            {loadError ? (
              <div className={cn(chatbotErrorBannerClass, 'mx-2 mt-2 shrink-0')}>{loadError}</div>
            ) : null}
            <div className={chatbotMobileDrawerBodyClass}>{drawerContent}</div>
          </ChatbotMobileDrawer>
        ) : null}
      </main>
    </div>
  )
}
