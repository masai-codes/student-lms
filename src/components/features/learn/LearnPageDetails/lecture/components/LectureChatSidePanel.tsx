'use client'

import { LectureResizableSidePanel } from './LectureResizableSidePanel'
import { useLectureSplitChatOptional } from '../hooks/LectureSplitChatContext'

import { LectureAiChatExperience } from '@/components/features/lecture-ai-chat/LectureAiChatExperience'

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
 * The resizable chat column: shares its shell (`LectureResizableSidePanel`)
 * with `LectureSqlSidePanel`, so both panels resize/animate identically.
 * Shared by the inline stage and the in-video fullscreen layout.
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
    <LectureResizableSidePanel
      testId="lecture-chat-panel"
      width={width}
      isDragging={isDragging}
      isOpen={isOpen}
      onResizeStart={onResizeStart}
      onNudge={onNudge}
    >
      <LectureAiChatExperience
        lectureId={lectureId}
        onCloseSidebar={onClose}
        languageMenuContainer={languageMenuContainer}
        chat={splitChat?.chat}
        feedback={splitChat?.feedback}
      />
    </LectureResizableSidePanel>
  )
}
