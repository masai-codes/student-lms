import { CaretRight, ChatText, Microphone } from '@phosphor-icons/react'
import type { SessionSummary } from '@/components/features/chatbot/types'
import { chatbotBtnPrimaryClass } from '@/components/features/chatbot/chatbotUi'
import { cn } from '@/lib/utils'

type SessionHistoryListProps = {
  sessions: SessionSummary[]
  activeSessionId: string | null
  loading: boolean
  onNewChat: () => void
  onSelect: (sessionId: string) => void
  showHeader?: boolean
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

export function SessionHistoryList({
  sessions,
  activeSessionId,
  loading,
  onNewChat,
  onSelect,
  showHeader = true,
}: SessionHistoryListProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {showHeader ? (
        <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
          <h2 className="type-b2 font-semibold text-gray-900">Question history</h2>
          <button type="button" className={chatbotBtnPrimaryClass} onClick={onNewChat}>
            New chat
          </button>
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
        {loading ? (
          <p className="my-1.5 text-xs text-gray-500">Loading...</p>
        ) : null}
        {!loading && sessions.length === 0 ? (
          <p className="my-1.5 text-xs text-gray-500">No questions yet for this lecture</p>
        ) : null}
        {sessions.map((session) => {
          const isActive = activeSessionId === session.sessionId
          const isVoice = session.lastMode === 'voice'
          const ModeIcon = isVoice ? Microphone : ChatText

          return (
            <button
              key={session.sessionId}
              type="button"
              className={cn(
                'flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                isActive
                  ? 'border-teal-700 bg-teal-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
              )}
              onClick={() => onSelect(session.sessionId)}
            >
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full',
                  isActive ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-600',
                )}
                aria-hidden
              >
                <ModeIcon className="size-4" weight="bold" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-gray-900">
                  {session.title}
                </span>
                <span className="mt-0.5 block text-[11px] text-gray-500">
                  {formatRelativeTime(session.updatedAt)} · {isVoice ? 'Voice' : 'Text'}
                </span>
              </span>
              <CaretRight
                className={cn('size-4 shrink-0', isActive ? 'text-teal-700' : 'text-gray-400')}
                weight="bold"
                aria-hidden
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
