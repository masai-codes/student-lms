import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchAnnouncementPopups,
  markAnnouncementRead,
  markMessageRead,
} from '@/lib/api/announcement/announcementApi'
import type { PopupItem } from '@/server/api/announcement/getAnnouncementPopups.service'

const POPUPS_STALE_MS = 30_000

/**
 * How long to wait after starting the close animation before advancing to the
 * next queued popup. Must be ≥ the modal's exit-animation duration so the
 * current popup fully animates out before the next animates in — otherwise the
 * two overlap and appear at the same time.
 */
const CLOSE_ANIMATION_MS = 300

function popupKey(item: Pick<PopupItem, 'source' | 'id'>): string {
  return `${item.source}:${item.id}`
}

export interface AnnouncementPopupQueue {
  /** The popup to show right now, or null when the queue is drained. */
  current: PopupItem | null
  /** Whether the modal should be visible (false while it animates closed). */
  open: boolean
  /** Whether a mark-read request is in flight (disable the primary CTA). */
  isSubmitting: boolean
  /** Mark read + advance. Always available (independent of the link CTA). */
  handleMarkRead: () => void
  /** Link CTA — mark read, close the modal, then open the link. */
  handleCta: () => void
  /** "Show me later" / backdrop / escape — close without marking read. */
  handleShowLater: () => void
}

/**
 * Drives the announcement popup queue: fetches pending popups (announcements +
 * direct messages flagged `show_as_popup`) and shows them one at a time.
 *
 * - **Mark read / CTA** permanently dismiss the popup (server-side read).
 * - **Show me later** hides it for this session only — it reappears on reload.
 *
 * Popups are strictly sequential: closing one plays its exit animation to
 * completion before the next one animates in, so they never appear together.
 *
 * Fetches whenever mounted (any authenticated page) and on window focus.
 */
export function useAnnouncementPopups(): AnnouncementPopupQueue {
  const queryClient = useQueryClient()
  const { data: popups = [] } = useQuery({
    queryKey: ['announcement', 'popups'],
    queryFn: fetchAnnouncementPopups,
    staleTime: POPUPS_STALE_MS,
    refetchOnWindowFocus: true,
  })

  // `current` holds the item being displayed (kept during the exit animation).
  const [current, setCurrent] = useState<PopupItem | null>(null)
  // `open` controls visibility so the modal can animate closed before advancing.
  const [open, setOpen] = useState(false)
  // Marked read / actioned this session — hidden until the refetch drops them.
  const handledRef = useRef(new Set<string>())
  // "Show me later" — hidden until the page reloads (not marked read).
  const dismissedRef = useRef(new Set<string>())
  // Pending "advance to next" timer, so we can clean it up on unmount.
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Pending "open CTA link" timer — fires after the modal has closed so opening
  // the new tab doesn't freeze the exit animation and leave a stuck overlay.
  const ctaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Pick the next unhandled popup whenever we're idle (no current on screen).
  useEffect(() => {
    if (current) return
    const next = popups.find(
      (p) =>
        !handledRef.current.has(popupKey(p)) &&
        !dismissedRef.current.has(popupKey(p)),
    )
    if (next) {
      setCurrent(next)
      setOpen(true)
    }
  }, [popups, current])

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
      if (ctaTimerRef.current) clearTimeout(ctaTimerRef.current)
    }
  }, [])

  const markReadMutation = useMutation({
    mutationFn: (item: PopupItem) =>
      item.source === 'a'
        ? markAnnouncementRead(Number(item.id))
        : markMessageRead(item.id),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ['announcement'] }),
  })

  // Start the close animation, then clear `current` so the effect advances to
  // the next queued popup only once the exit animation has finished.
  const closeAndAdvance = useCallback(() => {
    setOpen(false)
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
    advanceTimerRef.current = setTimeout(() => {
      setCurrent(null)
      advanceTimerRef.current = null
    }, CLOSE_ANIMATION_MS)
  }, [])

  const completeAsRead = useCallback(
    (item: PopupItem) => {
      handledRef.current.add(popupKey(item))
      markReadMutation.mutate(item)
      closeAndAdvance()
    },
    [markReadMutation, closeAndAdvance],
  )

  const handleMarkRead = useCallback(() => {
    if (!current) return
    completeAsRead(current)
  }, [current, completeAsRead])

  const handleCta = useCallback(() => {
    const link = current?.ctaLink?.trim()
    if (!current) return
    // Mark read and close first; only open the link once the modal has fully
    // animated out. Opening it immediately would switch focus to the new tab
    // mid-animation, freezing the exit transition and leaving a faint, stuck
    // overlay behind when the user returns. The short delay stays well within
    // the browser's user-activation window, so the new tab isn't blocked.
    completeAsRead(current)
    if (link) {
      if (ctaTimerRef.current) clearTimeout(ctaTimerRef.current)
      ctaTimerRef.current = setTimeout(() => {
        window.open(link, '_blank', 'noopener,noreferrer')
        ctaTimerRef.current = null
      }, CLOSE_ANIMATION_MS)
    }
  }, [current, completeAsRead])

  const handleShowLater = useCallback(() => {
    if (!current) return
    dismissedRef.current.add(popupKey(current))
    closeAndAdvance()
  }, [current, closeAndAdvance])

  return {
    current,
    open,
    isSubmitting: markReadMutation.isPending,
    handleMarkRead,
    handleCta,
    handleShowLater,
  }
}
