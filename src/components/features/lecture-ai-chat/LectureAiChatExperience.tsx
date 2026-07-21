'use client'

import { LectureAiChatMobileDock } from './components/LectureAiChatMobileDock'
import { LectureAiChatPanel } from './components/LectureAiChatPanel'
import { useLectureAiChat } from './hooks/useLectureAiChat'
import { useLectureAiChatFeedback } from './hooks/useLectureAiChatFeedback'

import './lecture-ai-chat.css'

type LectureAiChatExperienceProps = {
  lectureId: number
  onCloseSidebar?: () => void
  /**
   * `panel` (default) fills its container with the full chat surface — used by
   * the desktop floating popup, the in-video overlay, and the fullscreen route.
   * `mobile-dock` shows only the composer and opens the chat in a bottom drawer
   * on send — used by the mobile below-hero block.
   */
  variant?: 'panel' | 'mobile-dock'
  /** Whether the floating popup is maximized (renders a minimize control). */
  isExpanded?: boolean
  /** Toggles the floating popup between docked and maximized. */
  onToggleExpand?: () => void
  /**
   * Portal target for the composer's language menu. The floating popup passes
   * its own node so the menu renders inside the popup (above it, and within the
   * video's fullscreen root) rather than behind it at `<body>`.
   */
  languageMenuContainer?: HTMLElement | null
}

export function LectureAiChatExperience({
  lectureId,
  onCloseSidebar,
  variant = 'panel',
  isExpanded,
  onToggleExpand,
  languageMenuContainer,
}: LectureAiChatExperienceProps) {
  const platform = variant === 'mobile-dock' ? 'web-mobile' : 'web-desktop'
  const feedback = useLectureAiChatFeedback(lectureId)
  const chat = useLectureAiChat(
    lectureId,
    platform,
    feedback.notifyFirstReplyCompleted,
  )

  if (variant === 'mobile-dock') {
    return (
      <LectureAiChatMobileDock
        chat={chat}
        lectureId={lectureId}
        feedback={feedback}
      />
    )
  }

  // `h-full` fills bounded parents (desktop sidebar, in-video overlay, and the
  // fullscreen route whose <main> is `flex-1 min-h-0`).
  return (
    <LectureAiChatPanel
      chat={chat}
      lectureId={lectureId}
      onClose={onCloseSidebar}
      feedback={feedback}
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
      languageMenuContainer={languageMenuContainer}
    />
  )
}
