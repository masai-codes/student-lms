'use client'

import { useRef } from 'react'

import { useLectureChatDock } from '../hooks/useLectureChatDock'
import {
  LECTURE_CHAT_OPENING_LOADER_ENABLED,
  LECTURE_CHAT_OPENING_LOADER_GIF,
  LECTURE_CHAT_OPENING_LOADER_SIZE_PX,
  LECTURE_CHAT_OPENING_LOADER_SWEEP_MS,
} from './constants/lectureAiChatUi'
import { LectureAiChatBar } from './LectureAiChatBar'
import { LectureAiChatPanel } from './LectureAiChatPanel'
import { useLectureAiChatStateContext } from './LectureAiChatStateContext'

import { cn } from '@/lib/utils'

type LectureAiChatDockProps = {
  className?: string
  onDockedChange?: (isDocked: boolean) => void
  openingLoaderSweepMs?: number
  openingLoaderSizePx?: number
  showOpeningLoader?: boolean
  openingLoaderGif?: string
}

/**
 * Inline above tabs on load; fixed to bottom once the user scrolls past the anchor.
 *
 * Reads chat state from the `LectureAiChatStateContext` so it stays in sync
 * with the desktop sidebar.
 */
export function LectureAiChatDock({
  className,
  onDockedChange,
  openingLoaderSweepMs = LECTURE_CHAT_OPENING_LOADER_SWEEP_MS,
  openingLoaderSizePx = LECTURE_CHAT_OPENING_LOADER_SIZE_PX,
  showOpeningLoader = LECTURE_CHAT_OPENING_LOADER_ENABLED,
  openingLoaderGif = LECTURE_CHAT_OPENING_LOADER_GIF,
}: LectureAiChatDockProps) {
  const chat = useLectureAiChatStateContext()
  const { anchorRef, isDocked, chatBarBlockPx } =
    useLectureChatDock(onDockedChange)
  const chatBarRef = useRef<HTMLDivElement>(null)

  if (!chat) return null

  const bar = (
    <div ref={chatBarRef} className="w-full">
      <LectureAiChatBar
        value={chat.inputValue}
        onChange={chat.setInputValue}
        onFocus={chat.open}
        onSend={chat.sendMessage}
        onMicToggle={chat.toggleMic}
        isSending={chat.isSending}
        isMicEnabled={chat.isMicEnabled}
        isMicPending={chat.isMicPending}
      />
    </div>
  )

  const panelProps = {
    chatBarRef,
    isOpen: chat.isExpanded,
    messages: chat.messages,
    isSending: chat.isSending,
    isHistoryLoading: chat.isHistoryLoading,
    sessionState: chat.sessionState,
    errorCode: chat.errorCode,
    isMicEnabled: chat.isMicEnabled,
    isAgentSpeaking: chat.isAgentSpeaking,
    onClose: chat.close,
    openingLoaderSweepMs,
    openingLoaderSizePx,
    showOpeningLoader,
    openingLoaderGif,
  } as const

  return (
    <>
      <div
        ref={anchorRef}
        className={cn('relative z-30 shrink-0 px-0 pb-2 pt-3', className)}
        style={isDocked ? { minHeight: chatBarBlockPx } : undefined}
      >
        {!isDocked ? (
          <>
            <LectureAiChatPanel variant="anchor" {...panelProps} />
            {bar}
          </>
        ) : null}
      </div>

      {isDocked ? (
        <div
          className={cn(
            'fixed inset-x-0 z-[220] flex flex-col',
            'border-t border-border/80 bg-[#FAF9F9]/95 backdrop-blur-md dark:bg-surface/95',
            'bottom-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]',
            'max-md:bottom-[calc(4.5rem+env(safe-area-inset-bottom))]',
            'max-md:pb-[max(0.5rem,env(safe-area-inset-bottom))]',
          )}
        >
          <div className={cn('w-full px-4 md:px-6', 'flex flex-col')}>
            <LectureAiChatPanel variant="raised" {...panelProps} />
            <div className="py-3">{bar}</div>
          </div>
        </div>
      ) : null}
    </>
  )
}
