import type { SessionSummary } from '@/components/features/chatbot/types'

type SessionSidebarProps = {
  sessions: SessionSummary[]
  activeSessionId: string | null
  loading: boolean
  onNewChat: () => void
  onSelect: (sessionId: string) => void
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString()
}

export function SessionSidebar({
  sessions,
  activeSessionId,
  loading,
  onNewChat,
  onSelect,
}: SessionSidebarProps) {
  return (
    <aside className="chatbot-session-sidebar" aria-label="Question history">
      <div className="chatbot-session-sidebar-header">
        <h2 className="chatbot-session-sidebar-title">Your questions</h2>
        <button type="button" className="chatbot-btn chatbot-btn-primary" onClick={onNewChat}>
          New question
        </button>
      </div>
      <div className="chatbot-session-list">
        {loading && <p className="chatbot-session-list-empty">Loading...</p>}
        {!loading && sessions.length === 0 && (
          <p className="chatbot-session-list-empty">No questions yet for this lecture</p>
        )}
        {sessions.map((session) => (
          <button
            key={session.sessionId}
            type="button"
            className={`chatbot-session-item ${activeSessionId === session.sessionId ? 'chatbot-session-item-active' : ''}`}
            onClick={() => onSelect(session.sessionId)}
          >
            <span className="chatbot-session-item-title">{session.title}</span>
            <span className="chatbot-session-item-meta">
              {formatRelativeTime(session.updatedAt)} · {session.lastMode === 'voice' ? 'Voice' : 'Text'}
            </span>
          </button>
        ))}
      </div>
    </aside>
  )
}

