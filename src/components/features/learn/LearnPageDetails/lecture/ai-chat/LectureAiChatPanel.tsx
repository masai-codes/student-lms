'use client'

import { Microphone, WarningCircle, X } from '@phosphor-icons/react'

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
import { aiTutorErrorMessage } from './utils/aiTutorErrorMessage'
import type { RefObject } from 'react'
import type { AiTutorSessionState, LectureChatMessage } from './types'


import { cn } from '@/lib/utils'

import './lectureAiChatPanel.css'

type LectureAiChatPanelVariant = 'anchor' | 'raised' | 'sidebar'

type LectureAiChatPanelProps = {
  isOpen: boolean
  messages: Array<LectureChatMessage>
  isSending: boolean
  isHistoryLoading?: boolean
  sessionState?: AiTutorSessionState
  errorCode?: string | null
  isMicEnabled?: boolean
  isAgentSpeaking?: boolean
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

type StatusBadge = {
  tone: 'idle' | 'listening' | 'speaking' | 'connecting'
  label: string
}

function resolveStatus(props: {
  sessionState?: AiTutorSessionState
  isMicEnabled?: boolean
  isAgentSpeaking?: boolean
}): StatusBadge | null {
  if (props.sessionState === 'creating' || props.sessionState === 'connecting') {
    return { tone: 'connecting', label: 'Connecting…' }
  }
  if (props.isAgentSpeaking) {
    return { tone: 'speaking', label: 'AI Tutor is speaking' }
  }
  if (props.isMicEnabled) {
    return { tone: 'listening', label: 'Listening…' }
  }
  return null
}

export function LectureAiChatPanel({
  isOpen,
  messages,
  isSending,
  isHistoryLoading = false,
  sessionState,
  errorCode = null,
  isMicEnabled = false,
  isAgentSpeaking = false,
  onClose,
  chatBarRef,
  variant = 'anchor',
  openingLoaderSweepMs = LECTURE_CHAT_OPENING_LOADER_SWEEP_MS,
  openingLoaderSizePx = LECTURE_CHAT_OPENING_LOADER_SIZE_PX,
  showOpeningLoader: showOpeningLoaderEnabled = LECTURE_CHAT_OPENING_LOADER_ENABLED,
  openingLoaderGif = LECTURE_CHAT_OPENING_LOADER_GIF,
  className,
}: LectureAiChatPanelProps) {
  const isSidebar = variant === 'sidebar'

  const { isPresent, isExpanded, isClosing, isActive } =
    useLectureChatPanelAnimation(isOpen)

  const { showOpeningLoader } = useLectureChatPanelOpeningLoader(
    isOpen,
    openingLoaderSweepMs,
    showOpeningLoaderEnabled,
  )

  const { listRef, panelHeightPx } = useLectureChatPanelLayout({
    isOpen: isActive && !isSidebar,
    chatBarRef,
    messagesLength: messages.length,
    isSending,
  })

  const status = resolveStatus({ sessionState, isMicEnabled, isAgentSpeaking })
  const errorMessage = aiTutorErrorMessage(errorCode)

  if (!isSidebar && !isPresent) return null
  if (isSidebar && !isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="AI Tutor chat"
      aria-hidden={isSidebar ? !isOpen : !isExpanded}
      className={cn(
        'lecture-chat-panel flex w-full max-w-full flex-col overflow-hidden',
        isSidebar
          ? 'lecture-chat-panel--sidebar min-h-0 flex-1 rounded-none border-0 bg-[#1c1c1c] shadow-none'
          : cn(
              'rounded-2xl border border-white/15 bg-[#1c1c1c]',
              'shadow-[0_-8px_32px_rgba(0,0,0,0.4)]',
              isExpanded && 'lecture-chat-panel--open',
              isClosing && 'lecture-chat-panel--closing',
              variant === 'anchor' &&
                'absolute bottom-full left-0 right-0 z-50 mb-2',
              variant === 'raised' && 'shrink-0 rounded-b-none',
            ),
        isMicEnabled && 'lecture-chat-panel--listening',
        className,
      )}
      style={
        isSidebar
          ? undefined
          : { height: panelHeightPx, maxHeight: panelHeightPx }
      }
    >
      <div className="lecture-chat-panel__inner flex min-h-0 flex-1 flex-col">
        <div
          className={cn(
            'flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-3',
            isSidebar ? '' : 'justify-between',
          )}
        >
          <p className="type-b1-md !text-white">AI Tutor</p>
          {status ? (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
                'type-caption-regular',
                status.tone === 'listening' && 'bg-red-500/15 !text-red-300',
                status.tone === 'speaking' && 'bg-primary-500/15 !text-primary-200',
                status.tone === 'connecting' && 'bg-white/10 !text-gray-200',
              )}
              aria-live="polite"
            >
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  status.tone === 'listening' && 'lecture-chat-status-dot bg-red-400',
                  status.tone === 'speaking' && 'lecture-chat-status-dot bg-primary-300',
                  status.tone === 'connecting' && 'bg-gray-300',
                )}
              />
              {status.label}
            </span>
          ) : null}
          {!isSidebar ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close chat"
              className="ml-auto flex size-8 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="size-5" weight="bold" />
            </button>
          ) : null}
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col">
          <div
            ref={listRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4"
          >
            {errorMessage ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2"
              >
                <WarningCircle
                  className="mt-0.5 size-4 shrink-0 !text-red-300"
                  weight="fill"
                />
                <p className="type-caption-regular !text-red-200">
                  {errorMessage}
                </p>
              </div>
            ) : null}
            {isHistoryLoading && messages.length === 0 ? (
              <p className="type-caption-regular !text-gray-400">
                Loading chat history…
              </p>
            ) : null}
            {messages.length === 0 && !isHistoryLoading && !isSending && !errorMessage ? (
              <div className="space-y-2 py-4">
                <p className="type-b2-regular !text-gray-300">
                  Ask anything about this lecture.
                </p>
                <p className="inline-flex items-center gap-1.5 type-caption-regular !text-gray-400">
                  <Microphone className="size-3.5" weight="fill" />
                  Tap the mic to speak instead — replies appear right here.
                </p>
              </div>
            ) : null}
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
