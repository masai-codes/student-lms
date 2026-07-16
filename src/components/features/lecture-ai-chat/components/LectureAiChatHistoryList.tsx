'use client'

import { ChevronRight, MessageSquare } from 'lucide-react'

import type { AiTutorConversationSummary } from '@/lib/api/ai-tutor/aiTutorChatApi'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (Number.isNaN(diffMin)) return ''
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString()
}

type LectureAiChatHistoryListProps = {
  conversations: Array<AiTutorConversationSummary>
  activeChatId: number | null
  isLoading: boolean
  isError: boolean
  onSelect: (chatId: number) => void
}

export function LectureAiChatHistoryList({
  conversations,
  activeChatId,
  isLoading,
  isError,
  onSelect,
}: LectureAiChatHistoryListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 px-4 py-4">
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="px-4 py-6 text-center text-sm text-muted-foreground">
        Couldn’t load your chat history. Please try again.
      </p>
    )
  }

  if (conversations.length === 0) {
    return (
      <p className="px-4 py-6 text-center text-sm text-muted-foreground">
        No past chats for this lecture yet.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 px-3 py-3">
      {conversations.map((conversation) => {
        const isActive = activeChatId === conversation.chatId
        return (
          <button
            key={conversation.chatId}
            type="button"
            onClick={() => onSelect(conversation.chatId)}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
              isActive
                ? 'border-primary bg-accent'
                : 'border-border bg-background hover:bg-accent',
            )}
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
              aria-hidden
            >
              <MessageSquare className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-foreground">
                {conversation.title}
              </span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                {formatRelativeTime(conversation.updatedAt)}
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
        )
      })}
    </div>
  )
}
