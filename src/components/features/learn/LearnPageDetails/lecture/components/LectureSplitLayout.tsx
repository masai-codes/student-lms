'use client'

import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

import { LectureChatSidePanel } from './LectureChatSidePanel'
import { LectureSqlSidePanel } from './LectureSqlSidePanel'
import { LectureSplitChatProvider } from '../hooks/LectureSplitChatContext'
import { LectureSqlPlaygroundProvider } from '../hooks/LectureSqlPlaygroundContext'
import { useChatPanelReveal } from '../hooks/useChatPanelReveal'
import { useLectureChatWidth } from '../hooks/useLectureChatWidth'
import { useLectureRailViewport } from '../hooks/useLectureRailViewport'
import { useLectureSplitChatOpen } from '../hooks/useLectureSplitChatOpen'
import { useLectureSqlPlaygroundOpen } from '../hooks/useLectureSqlPlaygroundOpen'
import { useViewportScrollLock } from '../hooks/useViewportScrollLock'
import { useLectureVideoFullscreenActive } from '../video/hooks/useLectureVideoFullscreen'
import { useLectureAiChat } from '@/components/features/lecture-ai-chat/hooks/useLectureAiChat'
import { useLectureAiChatFeedback } from '@/components/features/lecture-ai-chat/hooks/useLectureAiChatFeedback'
import type {
  InLecturePopupMetaData,
  InLecturePopupSqlSandboxElement,
} from '@/server/learn/lectureDetailTypes'

type LectureSplitLayoutProps = {
  lectureId: number
  /** The whole lecture page — video hero, header, tabs, footer. */
  children: ReactNode
  /** SQL Playground config/history — the rail renders nothing when disabled. */
  sqlMetaData?: InLecturePopupMetaData | null
  sqlSandbox?: Array<InLecturePopupSqlSandboxElement>
}

type SidePanelKind = 'chat' | 'sql' | null

/**
 * Desktop lecture layout: the entire page is the left section, and the right
 * side is a single resizable rail shared by the AI chat and the SQL
 * Playground — whichever was opened most recently (they're mutually
 * exclusive; opening one closes the other, since there's only one rail slot).
 * The two scroll independently — scrolling the page never moves the rail —
 * and the learner drags the divider to trade width between them.
 *
 * Owns both the chat session (`LectureSplitChatContext`) and the SQL
 * Playground's open state (`LectureSqlPlaygroundContext`) so they survive
 * both this rail toggling and the in-video fullscreen split taking over:
 * while the video is in browser fullscreen the rail is hidden and the
 * in-video split (`LectureReactPlayer`) renders the same panel instead.
 *
 * Below `lg` (mobile + tablet) there is no rail — the page scrolls naturally
 * and each panel opens as its own bottom drawer (`LectureAiChatMobileEntry`,
 * `LectureSqlPlaygroundMobileEntry`), both driven by these same shared
 * open-states so the player's toolbar pills drive them too.
 */
export function LectureSplitLayout({
  lectureId,
  children,
  sqlMetaData = null,
  sqlSandbox = [],
}: LectureSplitLayoutProps) {
  const splitChatState = useLectureSplitChatOpen()
  const sqlPlaygroundState = useLectureSqlPlaygroundOpen()
  const isVideoFullscreen = useLectureVideoFullscreenActive()
  const rowRef = useRef<HTMLDivElement>(null)
  const isDesktop = useLectureRailViewport()
  const { width, isDragging, startResize, nudge } = useLectureChatWidth(rowRef)

  // The two panels share one rail slot — opening either closes the other.
  const openChat = useCallback(() => {
    sqlPlaygroundState.close()
    splitChatState.open()
  }, [sqlPlaygroundState, splitChatState])
  const openSqlPlayground = useCallback(
    (entryId?: number) => {
      splitChatState.close()
      sqlPlaygroundState.open(entryId)
    },
    [splitChatState, sqlPlaygroundState],
  )
  const splitChat = { ...splitChatState, open: openChat }
  const sqlPlayground = { ...sqlPlaygroundState, open: openSqlPlayground }

  const activePanel: SidePanelKind = splitChat.isOpen
    ? 'chat'
    : sqlPlayground.isOpen
      ? 'sql'
      : null
  // Which panel to render through the close transition — `activePanel` goes
  // null the instant either closes, but the reveal (below) keeps the slot
  // mounted for another `CHAT_PANEL_REVEAL_MS` so it can animate out; without
  // this the panel would vanish instantly instead of sliding shut.
  const [renderedPanel, setRenderedPanel] = useState<SidePanelKind>(activePanel)
  useEffect(() => {
    if (activePanel !== null) setRenderedPanel(activePanel)
  }, [activePanel])

  const { isRendered, isOpenAnim } = useChatPanelReveal(
    isDesktop && activePanel !== null && !isVideoFullscreen,
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

  // Chat is "active" — and the feedback prompt withheld — while a reply is
  // in flight/streaming or the learner is typing in the composer, across
  // whichever surface (rail, in-video fullscreen, mobile drawer) is mounted.
  const isChatActive = chat.isSending || chat.input.length > 0
  useEffect(() => {
    feedback.reportActivity(isChatActive)
  }, [feedback, isChatActive])

  return (
    <LectureSplitChatProvider value={{ ...splitChat, chat, feedback }}>
      <LectureSqlPlaygroundProvider value={sqlPlayground}>
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

          {/* Right section: full-height, resizable rail (laptop/desktop) shared
              by the AI chat and SQL Playground. Mobile and tablet use bottom
              drawers instead (LectureAiChatMobileEntry, LectureSqlPlaygroundMobileEntry). */}
          {isRendered && renderedPanel === 'chat' ? (
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
          {isRendered && renderedPanel === 'sql' ? (
            <LectureSqlSidePanel
              metaData={sqlMetaData}
              sqlSandbox={sqlSandbox}
              onClose={sqlPlayground.close}
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
      </LectureSqlPlaygroundProvider>
    </LectureSplitChatProvider>
  )
}
