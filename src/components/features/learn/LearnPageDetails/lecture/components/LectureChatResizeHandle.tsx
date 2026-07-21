'use client'

import { DotsSixVertical } from '@phosphor-icons/react'

import { CHAT_WIDTH_KEYBOARD_STEP } from '../hooks/useLectureChatWidth'
import { cn } from '@/lib/utils'

type LectureChatResizeHandleProps = {
  onPointerDown: (event: React.PointerEvent) => void
  onNudge: (deltaPx: number) => void
  isDragging: boolean
  className?: string
}

/**
 * Draggable separator between the lecture video and the chat panel. The grip is
 * always visible (a pill with a dotted handle + hover hint) so it's obvious the
 * split can be resized; supports pointer drag and Arrow keys.
 */
export function LectureChatResizeHandle({
  onPointerDown,
  onNudge,
  isDragging,
  className,
}: LectureChatResizeHandleProps) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Drag to resize the chat panel"
      title="Drag to resize"
      tabIndex={0}
      data-testid="lecture-chat-resize-handle"
      onPointerDown={onPointerDown}
      onKeyDown={(event) => {
        // Left grows the chat (it's on the right), Right shrinks it.
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          onNudge(CHAT_WIDTH_KEYBOARD_STEP)
        } else if (event.key === 'ArrowRight') {
          event.preventDefault()
          onNudge(-CHAT_WIDTH_KEYBOARD_STEP)
        }
      }}
      className={cn(
        'group relative flex w-3 shrink-0 cursor-col-resize touch-none select-none items-center justify-center',
        'focus-visible:outline-none',
        className,
      )}
    >
      {/* Divider line. */}
      <span
        aria-hidden
        className={cn(
          'absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border transition-colors',
          'group-hover:bg-brand/50 group-focus-visible:bg-brand',
          isDragging && 'bg-brand',
        )}
      />
      {/* Prominent grip chip. */}
      <span
        aria-hidden
        className={cn(
          'relative flex h-12 w-4 items-center justify-center rounded-full border bg-surface text-foreground-muted shadow-sm transition-colors',
          'border-border group-hover:border-brand group-hover:bg-brand group-hover:text-brand-foreground group-focus-visible:border-brand',
          isDragging && 'border-brand bg-brand text-brand-foreground',
        )}
      >
        <DotsSixVertical className="size-3.5" weight="bold" />
      </span>
      {/* Hover hint so the drag affordance is unmistakable. */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-md transition-opacity',
          '[@media(hover:hover)]:group-hover:opacity-100',
        )}
      >
        Drag to resize
      </span>
    </div>
  )
}
