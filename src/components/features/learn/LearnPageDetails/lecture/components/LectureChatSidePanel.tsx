'use client'

import { LectureChatResizeHandle } from './LectureChatResizeHandle'
import { useLectureSplitChatOptional } from '../hooks/LectureSplitChatContext'

import { LectureAiChatExperience } from '@/components/features/lecture-ai-chat/LectureAiChatExperience'
import { cn } from '@/lib/utils'

type LectureChatSidePanelProps = {
  lectureId: number
  onClose: () => void
  /** Target width (px) when open — animates 0 ↔ width. */
  width: number
  /** True while the divider is being dragged (disables the width transition). */
  isDragging: boolean
  /** Reveal state from `useChatPanelReveal` (open vs. closing). */
  isOpen: boolean
  onResizeStart: (event: React.PointerEvent) => void
  onNudge: (deltaPx: number) => void
  /** Portal target for the composer's language menu (the fullscreen root). */
  languageMenuContainer?: HTMLElement | null
}

/**
 * The resizable chat column: a draggable divider plus a width-animated panel
 * that reveals the chat surface. Shared by the inline stage and the in-video
 * fullscreen layout so both resize/animate identically.
 */
export function LectureChatSidePanel({
  lectureId,
  onClose,
  width,
  isDragging,
  isOpen,
  onResizeStart,
  onNudge,
  languageMenuContainer,
}: LectureChatSidePanelProps) {
  // The session lives on the context (owned by LectureSplitLayout) so it
  // is shared between the inline and in-video fullscreen mounts of this panel.
  const splitChat = useLectureSplitChatOptional()

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
        data-testid="lecture-chat-panel"
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
          <LectureAiChatExperience
            lectureId={lectureId}
            onCloseSidebar={onClose}
            languageMenuContainer={languageMenuContainer}
            chat={splitChat?.chat}
            feedback={splitChat?.feedback}
          />
        </div>
      </div>
    </>
  )
}
