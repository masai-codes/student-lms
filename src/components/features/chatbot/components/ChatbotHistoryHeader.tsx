import { CaretDoubleRight, ClockCounterClockwise } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

type ChatbotHistoryHeaderProps = {
  onOpenHistory: () => void
  onCloseSidebar?: () => void
  contextLabel?: string | null
}

export function ChatbotHistoryHeader({
  onOpenHistory,
  onCloseSidebar,
  contextLabel = null,
}: ChatbotHistoryHeaderProps) {

  return (
    <div
      className={cn(
        'flex shrink-0 items-center border-b border-gray-200 px-3 py-2.5',
        'justify-between gap-2',
      )}
    >
      <h2 className="type-b2 min-w-0 truncate font-semibold text-gray-900">
        Ask about the lecture
      </h2>
      <div className="flex shrink-0 items-center gap-2">
        {contextLabel ? (
          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">
            Context: {contextLabel}
          </span>
        ) : null}
        {onCloseSidebar ? (
          <button
            type="button"
            onClick={onCloseSidebar}
            aria-label="Close assistant"
            className="flex size-9 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-gray-800 transition-colors hover:bg-gray-100"
          >
            <CaretDoubleRight className="size-5" weight="bold" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onOpenHistory}
          aria-label="View question history"
          className="flex size-9 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-gray-800 transition-colors hover:bg-gray-100"
        >
          <ClockCounterClockwise className="size-5" weight="bold" />
        </button>
      </div>
    </div>
  )
}
