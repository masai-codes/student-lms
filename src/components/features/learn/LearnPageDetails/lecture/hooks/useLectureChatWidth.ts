'use client'

import { useCallback, useEffect, useState, type RefObject } from 'react'

/** Chat panel sizing (px). Kept readable without starving the video. */
const MIN_CHAT_WIDTH = 320
const DEFAULT_CHAT_WIDTH = 440
/** The video always keeps at least this much width beside the chat. */
const MIN_VIDEO_WIDTH = 475
const STORAGE_KEY = 'lecture-chat-width'
/** Keyboard resize step (px) for the separator. */
export const CHAT_WIDTH_KEYBOARD_STEP = 24

function readStoredWidth(): number {
  if (typeof window === 'undefined') return DEFAULT_CHAT_WIDTH
  try {
    const raw = Number(window.localStorage.getItem(STORAGE_KEY))
    return Number.isFinite(raw) && raw >= MIN_CHAT_WIDTH ? raw : DEFAULT_CHAT_WIDTH
  } catch {
    return DEFAULT_CHAT_WIDTH
  }
}

function persistWidth(width: number): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Math.round(width)))
  } catch {
    // Ignore storage failures (private mode, quota, etc.).
  }
}

/**
 * Manages the draggable width of the lecture chat side panel: pointer + keyboard
 * resize, clamping against the container so the video keeps a usable width, and
 * localStorage persistence.
 */
export function useLectureChatWidth(
  containerRef: RefObject<HTMLElement | null>,
) {
  const [width, setWidth] = useState(DEFAULT_CHAT_WIDTH)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    setWidth(readStoredWidth())
  }, [])

  const clamp = useCallback(
    (next: number) => {
      const container = containerRef.current
      const max = container
        ? Math.max(MIN_CHAT_WIDTH, container.clientWidth - MIN_VIDEO_WIDTH)
        : next
      return Math.min(Math.max(next, MIN_CHAT_WIDTH), max)
    },
    [containerRef],
  )

  const startResize = useCallback((event: React.PointerEvent) => {
    event.preventDefault()
    setIsDragging(true)
  }, [])

  const nudge = useCallback(
    (deltaPx: number) => {
      setWidth((current) => {
        const next = clamp(current + deltaPx)
        persistWidth(next)
        return next
      })
    },
    [clamp],
  )

  // Pointer drag: the chat sits at the container's right edge, so its width is
  // simply the distance from the pointer to that edge.
  useEffect(() => {
    if (!isDragging) return
    const onMove = (event: PointerEvent) => {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      setWidth(clamp(rect.right - event.clientX))
    }
    const onUp = () => {
      setIsDragging(false)
      setWidth((current) => {
        persistWidth(current)
        return current
      })
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }
  }, [isDragging, clamp, containerRef])

  // Re-clamp when the container (window) resizes so the panel never overruns.
  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => setWidth((current) => clamp(current)))
    observer.observe(container)
    return () => observer.disconnect()
  }, [clamp, containerRef])

  return { width, isDragging, startResize, nudge }
}
