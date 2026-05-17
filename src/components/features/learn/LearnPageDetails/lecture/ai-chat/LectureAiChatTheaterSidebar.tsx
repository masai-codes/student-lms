'use client'

import { useRef } from 'react'

import { LectureAiChatBar } from './LectureAiChatBar'
import { LectureAiChatPanel } from './LectureAiChatPanel'
import type { LectureChatMessage } from './constants/mockLectureChatMessages'

import { cn } from '@/lib/utils'

type LectureAiChatTheaterSidebarProps = {
  className?: string
  isExpanded: boolean
  isSending: boolean
  messages: Array<LectureChatMessage>
  inputValue: string
  onInputChange: (value: string) => void
  onOpen: () => void
  onClose: () => void
  onSend: () => void
  openingLoaderSweepMs?: number
  openingLoaderSizePx?: number
  showOpeningLoader?: boolean
  openingLoaderGif?: string
}

/** Right column in split layout: panel + composer, full bleed in the column. */
export function LectureAiChatTheaterSidebar({
  className,
  isExpanded,
  isSending,
  messages,
  inputValue,
  onInputChange,
  onOpen,
  onClose,
  onSend,
  openingLoaderSweepMs,
  openingLoaderSizePx,
  showOpeningLoader,
  openingLoaderGif,
}: LectureAiChatTheaterSidebarProps) {
  const chatBarRef = useRef<HTMLDivElement>(null)

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
        isOpen={isExpanded}
        messages={messages}
        isSending={isSending}
        onClose={onClose}
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
          value={inputValue}
          onChange={onInputChange}
          onFocus={onOpen}
          onSend={onSend}
          isSending={isSending}
          className="w-full"
        />
      </div>
    </aside>
  )
}
