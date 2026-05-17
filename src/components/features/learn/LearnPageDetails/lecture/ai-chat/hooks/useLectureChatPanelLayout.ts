'use client'

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react'

const PANEL_GAP_ABOVE_BAR_PX = 8
/** Extra breathing room below navbar so the panel does not touch the top edge. */
const PANEL_TOP_MARGIN_PX = 20
const MIN_PANEL_HEIGHT_PX = 140
const STICK_TO_BOTTOM_THRESHOLD_PX = 48

function getViewportTopBoundaryPx(): number {
  const navbar = document.querySelector<HTMLElement>('[data-app-navbar]')
  if (navbar) {
    return navbar.getBoundingClientRect().bottom + PANEL_TOP_MARGIN_PX
  }
  return PANEL_TOP_MARGIN_PX
}

/** Space from below navbar to top of chat bar — fixed panel height. */
export function measureLectureChatPanelHeightPx(
  chatBarEl: HTMLElement,
): number {
  const barTop = chatBarEl.getBoundingClientRect().top
  const topBoundary = getViewportTopBoundaryPx()
  const height = Math.floor(barTop - topBoundary - PANEL_GAP_ABOVE_BAR_PX)
  return Math.max(height, MIN_PANEL_HEIGHT_PX)
}

function isNearBottom(list: HTMLElement): boolean {
  return (
    list.scrollHeight - list.scrollTop - list.clientHeight <=
    STICK_TO_BOTTOM_THRESHOLD_PX
  )
}

function scrollListToBottom(list: HTMLElement) {
  list.scrollTop = list.scrollHeight
}

type UseLectureChatPanelLayoutOptions = {
  isOpen: boolean
  chatBarRef: RefObject<HTMLElement | null>
  messagesLength: number
  isSending: boolean
  isContentReady?: boolean
}

export function useLectureChatPanelLayout({
  isOpen,
  chatBarRef,
  messagesLength,
  isSending,
  isContentReady = true,
}: UseLectureChatPanelLayoutOptions) {
  const listRef = useRef<HTMLDivElement>(null)
  const [panelHeightPx, setPanelHeightPx] = useState(MIN_PANEL_HEIGHT_PX)
  const stickToBottomRef = useRef(true)
  const prevMessagesLengthRef = useRef(messagesLength)

  useLayoutEffect(() => {
    if (!isOpen) return

    const chatBar = chatBarRef.current
    if (!chatBar) return

    const updateHeight = () => {
      setPanelHeightPx(measureLectureChatPanelHeightPx(chatBar))
    }

    updateHeight()

    const resizeObserver = new ResizeObserver(updateHeight)
    resizeObserver.observe(chatBar)

    window.addEventListener('resize', updateHeight)
    window.addEventListener('scroll', updateHeight, true)
    window.visualViewport?.addEventListener('resize', updateHeight)
    window.visualViewport?.addEventListener('scroll', updateHeight)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateHeight)
      window.removeEventListener('scroll', updateHeight, true)
      window.visualViewport?.removeEventListener('resize', updateHeight)
      window.visualViewport?.removeEventListener('scroll', updateHeight)
    }
  }, [isOpen, chatBarRef])

  useEffect(() => {
    if (!isOpen || !isContentReady) {
      if (!isOpen) {
        stickToBottomRef.current = true
        prevMessagesLengthRef.current = messagesLength
      }
      return
    }

    const list = listRef.current
    if (!list) return

    const hasNewMessage = messagesLength > prevMessagesLengthRef.current
    prevMessagesLengthRef.current = messagesLength

    if (stickToBottomRef.current || hasNewMessage || isSending) {
      scrollListToBottom(list)
      if (hasNewMessage || isSending) {
        stickToBottomRef.current = true
      }
    }
  }, [isOpen, isContentReady, messagesLength, isSending, panelHeightPx])

  useEffect(() => {
    const list = listRef.current
    if (!list || !isOpen || !isContentReady) return

    const onListScroll = () => {
      stickToBottomRef.current = isNearBottom(list)
    }

    list.addEventListener('scroll', onListScroll, { passive: true })
    return () => list.removeEventListener('scroll', onListScroll)
  }, [isOpen, isContentReady])

  return { listRef, panelHeightPx }
}
