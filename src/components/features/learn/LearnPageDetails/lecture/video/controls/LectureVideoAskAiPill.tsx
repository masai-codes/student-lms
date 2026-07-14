import { Sparkle } from '@phosphor-icons/react'

import { cn } from '@/lib/utils'

type LectureVideoAskAiPillProps = {
  onClick: () => void
  className?: string
}

export function LectureVideoAskAiPill({
  onClick,
  className,
}: LectureVideoAskAiPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open lecture AI assistant"
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-white/25',
        'bg-surface/10 px-3 text-sm font-medium text-white backdrop-blur-sm',
        'transition-colors hover:border-teal-300/60 hover:bg-surface/15',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
        className,
      )}
    >
      <Sparkle className="size-4 text-teal-300" weight="fill" aria-hidden />
      Ask
    </button>
  )
}
