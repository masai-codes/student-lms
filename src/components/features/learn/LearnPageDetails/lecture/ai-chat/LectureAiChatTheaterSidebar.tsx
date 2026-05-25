'use client'

import { useRef } from 'react'

import { LectureAiChatBar } from './LectureAiChatBar'
import { LectureAiChatPanel } from './LectureAiChatPanel'
import { useLectureAiChatStateContext } from './LectureAiChatStateContext'

import { cn } from '@/lib/utils'

type LectureAiChatTheaterSidebarProps = {
  className?: string
  openingLoaderSweepMs?: number
  openingLoaderSizePx?: number
  showOpeningLoader?: boolean
  openingLoaderGif?: string
}

/**
 * Right column in the split layout: panel + composer, full bleed in the
 * column. Pulls its state from the shared `LectureAiChatStateContext`, so it
 * mirrors the mobile dock.
 */
export function LectureAiChatTheaterSidebar({
  className,
  openingLoaderSweepMs,
  openingLoaderSizePx,
  showOpeningLoader,
  openingLoaderGif,
}: LectureAiChatTheaterSidebarProps) {
  const chat = useLectureAiChatStateContext()
  const chatBarRef = useRef<HTMLDivElement>(null)

  if (!chat) return null

  return (
    <aside
      className={cn(
        'flex h-full min-h-0 w-full flex-col bg-[#1c1c1c]',
        className,
      )}
      aria-label="AI Tutor"
    >
      <LectureAiChatPanel
        variant="sidebar"
        chatBarRef={chatBarRef}
        isOpen={chat.isExpanded}
        messages={chat.messages}
        isSending={chat.isSending}
        isHistoryLoading={chat.isHistoryLoading}
        sessionState={chat.sessionState}
        errorCode={chat.errorCode}
        isMicEnabled={chat.isMicEnabled}
        isAgentSpeaking={chat.isAgentSpeaking}
        onClose={chat.close}
        openingLoaderSweepMs={openingLoaderSweepMs}
        openingLoaderSizePx={openingLoaderSizePx}
        showOpeningLoader={showOpeningLoader}
        openingLoaderGif={openingLoaderGif}
        className="min-h-0 flex-1"
      />
      <div
        ref={chatBarRef}
        className="shrink-0 border-t border-white/10 p-2"
      >
        <LectureAiChatBar
          value={chat.inputValue}
          onChange={chat.setInputValue}
          onFocus={chat.open}
          onSend={chat.sendMessage}
          onMicToggle={chat.toggleMic}
          isSending={chat.isSending}
          isMicEnabled={chat.isMicEnabled}
          isMicPending={chat.isMicPending}
          className="w-full"
        />
      </div>
    </aside>
  )
}
