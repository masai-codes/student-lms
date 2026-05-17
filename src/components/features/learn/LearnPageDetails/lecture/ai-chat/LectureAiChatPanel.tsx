'use client'

import type { RefObject } from 'react'
import { X } from '@phosphor-icons/react'

import { useLectureChatPanelAnimation } from './hooks/useLectureChatPanelAnimation'
import { useLectureChatPanelLayout } from './hooks/useLectureChatPanelLayout'
import { useLectureChatPanelOpeningLoader } from './hooks/useLectureChatPanelOpeningLoader'
import { LectureAiChatMessage } from './LectureAiChatMessage'
import { LectureAiChatPanelLoader } from './LectureAiChatPanelLoader'
import {
  LECTURE_CHAT_OPENING_LOADER_ENABLED,
  LECTURE_CHAT_OPENING_LOADER_GIF,
  LECTURE_CHAT_OPENING_LOADER_SIZE_PX,
  LECTURE_CHAT_OPENING_LOADER_SWEEP_MS,
} from './constants/lectureAiChatUi'
import type { LectureChatMessage } from './constants/mockLectureChatMessages'

import { cn } from '@/lib/utils'

import './lectureAiChatPanel.css'

type LectureAiChatPanelVariant = 'anchor' | 'raised'

type LectureAiChatPanelProps = {
  isOpen: boolean
  messages: Array<LectureChatMessage>
  isSending: boolean
  onClose: () => void
  chatBarRef: RefObject<HTMLElement | null>
  variant?: LectureAiChatPanelVariant
  /** Left → right gif sweep overlay duration on open (ms); messages render immediately. */
  openingLoaderSweepMs?: number
  /** Opening gif height in pixels. */
  openingLoaderSizePx?: number
  /** When false, messages show immediately (no sweep gif). */
  showOpeningLoader?: boolean
  /** Gif file in `/public` or full URL/path. */
  openingLoaderGif?: string
  className?: string
}

export function LectureAiChatPanel({
  isOpen,
  messages,
  isSending,
  onClose,
  chatBarRef,
  variant = 'anchor',
  openingLoaderSweepMs = LECTURE_CHAT_OPENING_LOADER_SWEEP_MS,
  openingLoaderSizePx = LECTURE_CHAT_OPENING_LOADER_SIZE_PX,
  showOpeningLoader: showOpeningLoaderEnabled = LECTURE_CHAT_OPENING_LOADER_ENABLED,
  openingLoaderGif = LECTURE_CHAT_OPENING_LOADER_GIF,
  className,
}: LectureAiChatPanelProps) {
  const { isPresent, isExpanded, isClosing, isActive } =
    useLectureChatPanelAnimation(isOpen)

  const { showOpeningLoader } = useLectureChatPanelOpeningLoader(
    isOpen,
    openingLoaderSweepMs,
    showOpeningLoaderEnabled,
  )

  const { listRef, panelHeightPx } = useLectureChatPanelLayout({
    isOpen: isActive,
    chatBarRef,
    messagesLength: messages.length,
    isSending,
  })

  if (!isPresent) return null

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="AI Tutor chat"
      aria-hidden={!isExpanded}
      className={cn(
        'lecture-chat-panel flex w-full max-w-full flex-col overflow-hidden',
        'rounded-2xl border border-white/15 bg-[#1c1c1c]',
        'shadow-[0_-8px_32px_rgba(0,0,0,0.4)]',
        isExpanded && 'lecture-chat-panel--open',
        isClosing && 'lecture-chat-panel--closing',
        variant === 'anchor' &&
          'absolute bottom-full left-0 right-0 z-50 mb-2',
        variant === 'raised' && 'shrink-0 rounded-b-none',
        className,
      )}
      style={{ height: panelHeightPx, maxHeight: panelHeightPx }}
    >
      <div className="lecture-chat-panel__inner flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
          <p className="type-b1-md !text-white">AI Tutor</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="flex size-8 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-5" weight="bold" />
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col">
          <div
            ref={listRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4"
          >
            {messages.map(message => (
              <LectureAiChatMessage key={message.id} message={message} />
            ))}
            {isSending ? (
              <p className="type-caption-regular !text-gray-400">Thinking…</p>
            ) : null}
          </div>

          {showOpeningLoader ? (
            <LectureAiChatPanelLoader
              sweepDurationMs={openingLoaderSweepMs}
              sizePx={openingLoaderSizePx}
              gif={openingLoaderGif}
              className="pointer-events-none absolute inset-0 z-10"
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
