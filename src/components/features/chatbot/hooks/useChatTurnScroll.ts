import { useLayoutEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { DisplayMessage } from '@/components/features/chatbot/types'
import {
  CHAT_USER_MESSAGE_ATTR,
  computeScrollTopToAlignMessageAtTop,
  findLatestUserMessage,
  getScrollSpacerHeightPx,
  getUserMessageMaxHeightPx,
} from '@/components/features/chatbot/utils/chatScroll'

const MIN_VIEWPORT_HEIGHT_PX = 0

type UseChatTurnScrollResult = {
  scrollContainerRef: RefObject<HTMLDivElement | null>
  viewportHeightPx: number
  spacerHeightPx: number
  userMessageMaxHeightPx: number
  latestUserMessageId: string | undefined
}

export function useChatTurnScroll(messages: Array<DisplayMessage>): UseChatTurnScrollResult {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [viewportHeightPx, setViewportHeightPx] = useState(MIN_VIEWPORT_HEIGHT_PX)
  const previousLatestUserMessageIdRef = useRef<string | undefined>(undefined)

  const latestUserMessage = findLatestUserMessage(messages)
  const latestUserMessageId = latestUserMessage?.id
  const spacerHeightPx = getScrollSpacerHeightPx(viewportHeightPx)
  const userMessageMaxHeightPx = getUserMessageMaxHeightPx(viewportHeightPx)

  useLayoutEffect(() => {
    const container = scrollContainerRef.current
    if (!container) {
      return
    }

    const updateViewportHeight = () => {
      const nextHeight = container.clientHeight
      setViewportHeightPx(nextHeight)
      container.style.setProperty('--chat-viewport-height', `${nextHeight}px`)
    }

    updateViewportHeight()

    const resizeObserver = new ResizeObserver(updateViewportHeight)
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  useLayoutEffect(() => {
    const container = scrollContainerRef.current
    if (!container || !latestUserMessageId) {
      return
    }

    const messageEl = container.querySelector<HTMLElement>(
      `[${CHAT_USER_MESSAGE_ATTR}="${latestUserMessageId}"]`,
    )
    if (!messageEl) {
      return
    }

    const hadPreviousUserMessage = previousLatestUserMessageIdRef.current != null
    const behavior: ScrollBehavior =
      hadPreviousUserMessage && previousLatestUserMessageIdRef.current !== latestUserMessageId
        ? 'smooth'
        : 'instant'

    previousLatestUserMessageIdRef.current = latestUserMessageId

    const scrollTop = computeScrollTopToAlignMessageAtTop(container, messageEl)
    container.scrollTo({ top: scrollTop, behavior })
  }, [latestUserMessageId, spacerHeightPx])

  return {
    scrollContainerRef,
    viewportHeightPx,
    spacerHeightPx,
    userMessageMaxHeightPx,
    latestUserMessageId,
  }
}
