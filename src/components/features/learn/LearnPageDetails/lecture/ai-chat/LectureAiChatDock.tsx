'use client'

import { useRef } from 'react'

import { LectureAiChatBar } from './LectureAiChatBar'
import { LectureAiChatPanel } from './LectureAiChatPanel'
import type { LectureChatMessage } from './constants/mockLectureChatMessages'
import { useLectureChatDock } from '../hooks/useLectureChatDock'

import { lectureDetailContentClasses } from '@/lib/layout'
import { cn } from '@/lib/utils'

type LectureAiChatDockProps = {
  className?: string
  onDockedChange?: (isDocked: boolean) => void
  isExpanded: boolean
  isSending: boolean
  messages: Array<LectureChatMessage>
  inputValue: string
  onInputChange: (value: string) => void
  onOpen: () => void
  onClose: () => void
  onSend: () => void
}

/**
 * Inline above tabs on load; fixed to bottom once the user scrolls past the anchor.
 */
export function LectureAiChatDock({
  className,
  onDockedChange,
  isExpanded,
  isSending,
  messages,
  inputValue,
  onInputChange,
  onOpen,
  onClose,
  onSend,
}: LectureAiChatDockProps) {
  const { anchorRef, isDocked, chatBarBlockPx } = useLectureChatDock(onDockedChange)
  const chatBarRef = useRef<HTMLDivElement>(null)

  const bar = (
    <div ref={chatBarRef} className="w-full">
      <LectureAiChatBar
        value={inputValue}
        onChange={onInputChange}
        onFocus={onOpen}
        onSend={onSend}
      />
    </div>
  )

  return (
    <>
      <div
        ref={anchorRef}
        className={cn('relative z-30 shrink-0 px-0 pb-2 pt-3', className)}
        style={isDocked ? { minHeight: chatBarBlockPx } : undefined}
      >
        {!isDocked ? (
          <>
            <LectureAiChatPanel
              variant="anchor"
              chatBarRef={chatBarRef}
              isOpen={isExpanded}
              messages={messages}
              isSending={isSending}
              onClose={onClose}
            />
            {bar}
          </>
        ) : null}
      </div>

      {isDocked ? (
        <div
          className={cn(
            'fixed inset-x-0 z-[220] flex flex-col',
            'border-t border-gray-200/80 bg-[#FAF9F9]/95 backdrop-blur-md',
            'bottom-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]',
            'max-md:bottom-[calc(4.5rem+env(safe-area-inset-bottom))]',
            'max-md:pb-[max(0.5rem,env(safe-area-inset-bottom))]',
          )}
        >
          <div className={cn(lectureDetailContentClasses, 'flex flex-col')}>
            <LectureAiChatPanel
              variant="raised"
              chatBarRef={chatBarRef}
              isOpen={isExpanded}
              messages={messages}
              isSending={isSending}
              onClose={onClose}
            />
            <div className="py-3">{bar}</div>
          </div>
        </div>
      ) : null}
    </>
  )
}
