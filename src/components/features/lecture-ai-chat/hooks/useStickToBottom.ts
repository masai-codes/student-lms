'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

/** How close to the bottom still counts as "pinned". */
const STICK_TO_BOTTOM_THRESHOLD_PX = 48

function isNearBottom(el: HTMLElement): boolean {
  return (
    el.scrollHeight - el.scrollTop - el.clientHeight <=
    STICK_TO_BOTTOM_THRESHOLD_PX
  )
}

export type UseStickToBottomResult = {
  listRef: RefObject<HTMLDivElement | null>
  /** True while the viewport is at/near the bottom (hide jump-to-latest). */
  isPinned: boolean
  scrollToBottom: (behavior?: ScrollBehavior) => void
}

/**
 * Keeps a scroll container pinned to the bottom as content grows, without
 * yanking the user down while they read scrolled-up history. A new message
 * (count increase) always re-pins; token growth only sticks if already pinned.
 *
 * @param messageCount     re-pins whenever this increases
 * @param contentSignature bump this on every streamed token to follow growth
 */
export function useStickToBottom(
  messageCount: number,
  contentSignature: number,
): UseStickToBottomResult {
  const listRef = useRef<HTMLDivElement>(null)
  const stickRef = useRef(true)
  const prevCountRef = useRef(messageCount)
  const [isPinned, setIsPinned] = useState(true)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const list = listRef.current
    if (!list) return
    list.scrollTo({ top: list.scrollHeight, behavior })
    stickRef.current = true
    setIsPinned(true)
  }, [])

  useEffect(() => {
    const list = listRef.current
    if (!list) return

    const hasNewMessage = messageCount > prevCountRef.current
    prevCountRef.current = messageCount
    if (hasNewMessage) {
      stickRef.current = true
      setIsPinned(true)
    }

    if (stickRef.current) {
      list.scrollTop = list.scrollHeight
    }
  }, [messageCount, contentSignature])

  useEffect(() => {
    const list = listRef.current
    if (!list) return

    const onScroll = () => {
      const near = isNearBottom(list)
      stickRef.current = near
      setIsPinned(near)
    }

    list.addEventListener('scroll', onScroll, { passive: true })
    return () => list.removeEventListener('scroll', onScroll)
  }, [])

  return { listRef, isPinned, scrollToBottom }
}
