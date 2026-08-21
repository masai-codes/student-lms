'use client'

import type { ReactNode } from 'react'

import { LectureChatResizeHandle } from './LectureChatResizeHandle'
import { cn } from '@/lib/utils'

type LectureResizableSidePanelProps = {
  testId: string
  /** Target width (px) when open — animates 0 ↔ width. */
  width: number
  /** True while the divider is being dragged (disables the width transition). */
  isDragging: boolean
  /** Reveal state from `useChatPanelReveal` (open vs. closing). */
  isOpen: boolean
  onResizeStart: (event: React.PointerEvent) => void
  onNudge: (deltaPx: number) => void
  children: ReactNode
}

/**
 * Shared shell for the lecture's resizable right-side panels: a draggable
 * divider plus a width-animated column that reveals whatever `children` is
 * given. Originally built for the AI chat (see `LectureChatSidePanel`); the
 * SQL Playground panel (`LectureSqlSidePanel`) reuses it unchanged so both
 * panels resize, animate, and sit relative to the video identically.
 */
export function LectureResizableSidePanel({
  testId,
  width,
  isDragging,
  isOpen,
  onResizeStart,
  onNudge,
  children,
}: LectureResizableSidePanelProps) {
  return (
    <>
      <LectureChatResizeHandle
        onPointerDown={onResizeStart}
        onNudge={onNudge}
        isDragging={isDragging}
        className={cn(
          'transition-opacity duration-300 ease-out motion-reduce:transition-none',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <div
        data-testid={testId}
        className={cn(
          // No left border here — the resize handle carries the single divider
          // line so the two don't stack into a thick-looking edge.
          'h-full min-h-0 shrink-0 overflow-hidden bg-background',
          // Animate open/close (width), but track the pointer 1:1 mid-drag.
          !isDragging &&
            'transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
        )}
        style={{ width: isOpen ? width : 0 }}
      >
        {/* Fixed-width content behind the clipping panel so it reveals cleanly
            instead of reflowing while the width animates. */}
        <div
          className={cn(
            'flex h-full min-h-0 flex-col transition-opacity duration-200 ease-out motion-reduce:transition-none',
            isOpen ? 'opacity-100' : 'opacity-0',
          )}
          style={{ width }}
        >
          {children}
        </div>
      </div>
    </>
  )
}
