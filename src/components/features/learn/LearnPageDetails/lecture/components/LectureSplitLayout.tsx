'use client'

import { type ReactNode, useRef } from 'react'

import { LectureChatSidePanel } from './LectureChatSidePanel'
import { LectureSplitChatProvider } from '../hooks/LectureSplitChatContext'
import { useChatPanelReveal } from '../hooks/useChatPanelReveal'
import { useLectureChatWidth } from '../hooks/useLectureChatWidth'
import { useLectureRailViewport } from '../hooks/useLectureRailViewport'
import { useLectureSplitChatOpen } from '../hooks/useLectureSplitChatOpen'
import { useViewportScrollLock } from '../hooks/useViewportScrollLock'
import { useLectureVideoFullscreenActive } from '../video/hooks/useLectureVideoFullscreen'
import { useLectureAiChat } from '@/components/features/lecture-ai-chat/hooks/useLectureAiChat'
import { useLectureAiChatFeedback } from '@/components/features/lecture-ai-chat/hooks/useLectureAiChatFeedback'

type LectureSplitLayoutProps = {
  lectureId: number
  /** The whole lecture page — video hero, header, tabs, footer. */
  children: ReactNode
}

/**
 * Desktop lecture layout: the entire page is the left section and the AI chat
 * is a full-height right rail. The two scroll independently — scrolling the
 * page never moves the chat, and the chat scrolls its own thread — and the
 * learner drags the divider to trade width between them.
 *
 * Owns the single chat session (see `LectureSplitChatContext`) so it survives
 * both this rail toggling and the in-video fullscreen chat taking over: while
 * the video is in browser fullscreen the rail is hidden and the in-video split
 * (LectureReactPlayer) renders the same session instead.
 *
 * Below `lg` (mobile + tablet) there is no rail — the page scrolls naturally
 * and the chat opens as a bottom drawer (LectureAiChatMobileEntry), triggered
 * by the same shared open-state so the player's "Ask AI" pill drives it too.
 */
export function LectureSplitLayout({
  lectureId,
  children,
}: LectureSplitLayoutProps) {
  const splitChat = useLectureSplitChatOpen()
  const isVideoFullscreen = useLectureVideoFullscreenActive()
  const rowRef = useRef<HTMLDivElement>(null)
  const isDesktop = useLectureRailViewport()
  const { width, isDragging, startResize, nudge } = useLectureChatWidth(rowRef)
  const { isRendered, isOpenAnim } = useChatPanelReveal(
    isDesktop && splitChat.isOpen && !isVideoFullscreen,
  )
  // Hands the shell a definite viewport height (so the row below can fill it)
  // and takes scrolling off the document entirely, so no gesture can reach past
  // the two columns into blank space. Lifted automatically on unmount / below
  // the rail breakpoint, where the page scrolls normally again.
  useViewportScrollLock(isDesktop)

  // The session shared by this rail and the in-video fullscreen chat. Lives
  // here (this component stays mounted across the fullscreen toggle) so the
  // conversation is never restarted when the panel swaps.
  const feedback = useLectureAiChatFeedback(lectureId)
  const chat = useLectureAiChat(
    lectureId,
    'web-desktop',
    feedback.notifyFirstReplyCompleted,
  )

  return (
    <LectureSplitChatProvider value={{ ...splitChat, chat, feedback }}>
      {/* The row fills the viewport below the sticky navbar through the flex
          chain (locked shell → `<main>` → route wrapper → here), never a measured
          pixel height: a JS height goes stale whenever the navbar grows (async
          banner, wrapping actions), leaving the document taller than the viewport
          — an extra window scroll into blank space underneath the
          already-scrollable left column. The definite height at the top of that
          chain comes from `useViewportScrollLock` above. */}
      <div
        ref={rowRef}
        className="flex w-full min-h-0 flex-col lg:min-h-0 lg:flex-1 lg:flex-row lg:overflow-hidden"
      >
        {/* Left section: the whole page, with its own scroll on laptop/desktop.
            `overscroll-contain`: reaching the end of this column must not chain
            the gesture on to the window. Otherwise a learner who keeps scrolling
            past the last discussion drags the whole shell up into blank space —
            the exact whitespace this layout is meant to remove. */}
        <div
          data-lecture-scroll-container
          className="flex min-h-0 min-w-0 flex-1 flex-col lg:overflow-y-auto lg:overscroll-contain"
        >
          {children}
        </div>

        {/* Right section: full-height, resizable AI chat rail (laptop/desktop).
            Mobile and tablet use the bottom drawer (LectureAiChatMobileEntry). */}
        {isRendered ? (
          <LectureChatSidePanel
            lectureId={lectureId}
            onClose={splitChat.close}
            width={width}
            isDragging={isDragging}
            isOpen={isOpenAnim}
            onResizeStart={startResize}
            onNudge={nudge}
          />
        ) : null}
      </div>

      {/* While dragging, a transparent overlay keeps the pointer stream off the
          video iframe (which would otherwise swallow pointermove events). */}
      {isDragging ? (
        <div className="fixed inset-0 z-[130] cursor-col-resize" />
      ) : null}
    </LectureSplitChatProvider>
  )
}
