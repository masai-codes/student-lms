'use client'

import { useRef, useState } from 'react'
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
 * Vaul's `repositionInputs` shifts the drawer up by the keyboard height using
 * `visualViewport` — correct on iOS Safari (where the keyboard never resizes
 * the layout viewport), but on Android our viewport meta
 * (`interactive-widget=resizes-content`) already shrinks the layout viewport
 * and the `90dvh` drawer with it, so vaul's extra shift detaches the drawer
 * from the keyboard and leaves a dead whitespace band. Keep it iOS-only.
 */
const shouldRepositionInputs = () =>
  typeof navigator === 'undefined' || !/android/i.test(navigator.userAgent)

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
  // The drawer content node, captured once mounted, so the composer's language
  // menu can portal *inside* the drawer instead of to <body>. Kept in state (not
  // a ref) so the picker re-renders with the real container once it's available.
  const [drawerContentEl, setDrawerContentEl] = useState<HTMLDivElement | null>(
    null,
  )

  // True while the composer's language menu is open. The drawer and the menu
  // are independent dismissable layers (vaul's dialog vs. Radix's menu) that
  // don't reliably coordinate, so an outside tap can dismiss both at once.
  // We block the drawer's own dismissal whenever the menu is open, so the
  // first outside tap closes only the menu. A ref (read synchronously inside
  // the dismiss handlers) avoids a re-render race with the closing tap, and we
  // release the guard on the next tick so that same tap can't also close the
  // drawer.
  const isLanguageMenuOpenRef = useRef(false)

  const handleLanguageMenuOpenChange = (open: boolean) => {
    if (open) {
      isLanguageMenuOpenRef.current = true
      return
    }
    setTimeout(() => {
      isLanguageMenuOpenRef.current = false
    }, 0)
  }

  const guardDismiss = (event: { preventDefault: () => void }) => {
    if (isLanguageMenuOpenRef.current) {
      event.preventDefault()
    }
  }

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

      {/* Read-only launcher: tapping opens the drawer but never pops the
          keyboard on this (outside-the-drawer) field. Opening on click — not
          focus — avoids a reopen loop when vaul restores focus here on close.
          The editable composer lives inside the drawer and auto-focuses, so the
          keyboard is driven from within, where vaul repositions it correctly. */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Ask the AI tutor"
        onClick={() => setIsOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setIsOpen(true)
          }
        }}
      >
        <LectureAiChatComposer
          value={chat.input}
          onChange={chat.setInput}
          onSend={handleSend}
          onStop={chat.stop}
          isSending={chat.isSending}
          language={chat.language}
          onLanguageChange={chat.setLanguage}
          platform="mobile"
          readOnly
        />
      </div>

      <Drawer.Root
        open={isOpen}
        onOpenChange={setIsOpen}
        repositionInputs={shouldRepositionInputs()}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[215] bg-black/50" />
          <Drawer.Content
            ref={setDrawerContentEl}
            className="fixed inset-x-0 bottom-0 z-[220] flex h-[90dvh] flex-col rounded-t-2xl border-t border-border bg-background outline-none"
            // While the language menu is open, the first outside tap should
            // close only the menu — never the drawer. vaul and Radix don't
            // coordinate their dismissable layers here, so we gate every
            // drawer-dismiss path on `isLanguageMenuOpenRef` (see above).
            onPointerDownOutside={guardDismiss}
            onInteractOutside={guardDismiss}
            onEscapeKeyDown={guardDismiss}
          >
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
              languageMenuContainer={drawerContentEl}
              onLanguageMenuOpenChange={handleLanguageMenuOpenChange}
            />
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  )
}
