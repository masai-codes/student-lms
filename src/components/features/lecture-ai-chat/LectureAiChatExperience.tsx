'use client'

import { useEffect } from 'react'

import { LectureAiChatPanel } from './components/LectureAiChatPanel'
import { useLectureAiChat } from './hooks/useLectureAiChat'
import { useLectureAiChatFeedback } from './hooks/useLectureAiChatFeedback'
import type { UseLectureAiChatResult } from './hooks/useLectureAiChat'
import type { UseLectureAiChatFeedbackResult } from './hooks/useLectureAiChatFeedback'

import './lecture-ai-chat.css'

type LectureAiChatExperienceProps = {
  lectureId: number
  onCloseSidebar?: () => void
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
  /**
   * Externally-owned chat session. Passed by the side panels so the inline rail
   * and the in-video fullscreen mount share one session (owned by
   * `LectureSplitLayout`); when omitted a local session is created. Supply both
   * `chat` and `feedback` together.
   */
  chat?: UseLectureAiChatResult
  feedback?: UseLectureAiChatFeedbackResult
}

/**
 * The full chat surface (`panel`). Fills its bounded container — the desktop
 * side rail, the in-video fullscreen split, and the fullscreen route. The
 * mobile/tablet bottom-drawer surface is `LectureAiChatMobileDock`.
 */
export function LectureAiChatExperience({
  lectureId,
  onCloseSidebar,
  isExpanded,
  onToggleExpand,
  languageMenuContainer,
  chat: chatProp,
  feedback: feedbackProp,
}: LectureAiChatExperienceProps) {
  // Local fallback session for when this mount isn't given a shared one. Hooks
  // run unconditionally; their state is simply unused when a shared session is
  // supplied.
  const localFeedback = useLectureAiChatFeedback(lectureId)
  const localChat = useLectureAiChat(
    lectureId,
    'web-new-desktop',
    localFeedback.notifyFirstReplyCompleted,
  )
  const feedback = feedbackProp ?? localFeedback
  const chat = chatProp ?? localChat

  // Chat is "active" — and the feedback prompt withheld — while a reply is
  // in flight/streaming or the learner is typing in the composer. Scrolling
  // the message list is reported separately (see `onScrollActivityChange`
  // below).
  const isComposing = chat.isSending || chat.input.length > 0
  useEffect(() => {
    feedback.reportActivity('compose', isComposing)
  }, [feedback, isComposing])

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
      onScrollActivityChange={(isScrolling) =>
        feedback.reportActivity('scroll', isScrolling)
      }
    />
  )
}
