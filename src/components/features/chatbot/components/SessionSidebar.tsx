import type { SessionSummary } from '@/components/features/chatbot/types'
import { SessionHistoryList } from '@/components/features/chatbot/components/SessionHistoryList'

type SessionSidebarProps = {
  sessions: SessionSummary[]
  activeSessionId: string | null
  loading: boolean
  onNewChat: () => void
  onSelect: (sessionId: string) => void
}

export function SessionSidebar({
  sessions,
  activeSessionId,
  loading,
  onNewChat,
  onSelect,
}: SessionSidebarProps) {
  return (
    <aside
      className="flex min-h-0 flex-col rounded-xl border border-gray-200 bg-white p-2.5"
      aria-label="Question history"
    >
      <SessionHistoryList
        sessions={sessions}
        activeSessionId={activeSessionId}
        loading={loading}
        onNewChat={onNewChat}
        onSelect={onSelect}
      />
    </aside>
  )
}
