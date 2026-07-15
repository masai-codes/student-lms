'use client'

import { useState } from 'react'
import { Drawer } from 'vaul'

import { LectureAiChatComposer } from './LectureAiChatComposer'
import { LectureAiChatFeedbackBanner } from './LectureAiChatFeedbackBanner'
import { LectureAiChatPanel } from './LectureAiChatPanel'
import type { UseLectureAiChatResult } from '../hooks/useLectureAiChat'
import type { UseLectureAiChatFeedbackResult } from '../hooks/useLectureAiChatFeedback'

type LectureAiChatMobileDockProps = {
  chat: UseLectureAiChatResult
  lectureId: number
  feedback: UseLectureAiChatFeedbackResult
}

/**
 * Mobile surface: shows only the composer ("search box"). Focusing the composer
 * (or sending) opens a bottom drawer holding the full chat panel, wired to the
 * same chat instance so typing/streaming continues inside the drawer — whose
 * composer auto-focuses so the keyboard stays up seamlessly. The feedback banner
 * (docs/AI_CHAT_FEEDBACK.md) becomes eligible as soon as the first reply in a
 * new thread completes, but only renders here — above the dock composer —
 * once the drawer is closed, so it never competes with the open chat.
 */
export function LectureAiChatMobileDock({
  chat,
  lectureId,
  feedback,
}: LectureAiChatMobileDockProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSend = () => {
    if (chat.input.trim().length === 0) return
    setIsOpen(true)
    chat.sendMessage()
  }

  return (
    <div className="">
      {!isOpen && feedback.isVisible ? (
        <LectureAiChatFeedbackBanner
          isSubmitting={feedback.isSubmitting}
          submitError={feedback.submitError}
          onSubmit={feedback.submit}
          onDismiss={feedback.skip}
          className="mb-2"
        />
      ) : null}

      <LectureAiChatComposer
        value={chat.input}
        onChange={chat.setInput}
        onSend={handleSend}
        onStop={chat.stop}
        isSending={chat.isSending}
        language={chat.language}
        onLanguageChange={chat.setLanguage}
        platform="mobile"
        onFocus={() => setIsOpen(true)}
      />

      <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[215] bg-black/50" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-[220] flex h-[90dvh] flex-col rounded-t-2xl border-t border-border bg-background outline-none">
            <div className="flex shrink-0 cursor-grab justify-center pt-2.5 active:cursor-grabbing">
              <Drawer.Handle className="!h-1 !w-10 !bg-border" />
            </div>
            <Drawer.Title className="sr-only">AI Tutor chat</Drawer.Title>
            <LectureAiChatPanel
              chat={chat}
              lectureId={lectureId}
              onClose={() => setIsOpen(false)}
              className="min-h-0 flex-1"
              autoFocusComposer
              containScroll
            />
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  )
}
