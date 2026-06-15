import { CaretLeft } from '@phosphor-icons/react'
import type { SessionSummary } from '@/components/features/chatbot/types'
import { SessionHistoryList } from '@/components/features/chatbot/components/SessionHistoryList'

type ChatbotHistoryPanelProps = {
  sessions: SessionSummary[]
  activeSessionId: string | null
  loading: boolean
  onBack: () => void
  onNewChat: () => void
  onSelect: (sessionId: string) => void
}

export function ChatbotHistoryPanel({
  sessions,
  activeSessionId,
  loading,
  onBack,
  onNewChat,
  onSelect,
}: ChatbotHistoryPanelProps) {
  const handleNewChat = () => {
    onNewChat()
    onBack()
  }

  const handleSelect = (sessionId: string) => {
    onSelect(sessionId)
    onBack()
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <header className="flex shrink-0 items-center gap-2 border-b border-gray-200 px-3 py-2.5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to chat"
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-gray-800 transition-colors hover:bg-gray-100"
        >
          <CaretLeft className="size-5" weight="bold" />
        </button>
        <h2 className="type-b2 min-w-0 flex-1 font-semibold text-gray-900">Session history</h2>
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
        <SessionHistoryList
          sessions={sessions}
          activeSessionId={activeSessionId}
          loading={loading}
          onNewChat={handleNewChat}
          onSelect={handleSelect}
          showHeader={false}
        />
      </div>
    </div>
  )
}
