import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchAnnouncementPopups,
  markAnnouncementRead,
  markMessageRead,
} from '@/lib/api/announcement/announcementApi'
import type { PopupItem } from '@/server/api/announcement/getAnnouncementPopups.service'

const POPUPS_STALE_MS = 30_000

function popupKey(item: Pick<PopupItem, 'source' | 'id'>): string {
  return `${item.source}:${item.id}`
}

function hasCta(item: PopupItem): boolean {
  return Boolean(item.ctaName?.trim() && item.ctaLink?.trim())
}

export interface AnnouncementPopupQueue {
  /** The popup to show right now, or null when the queue is drained. */
  current: PopupItem | null
  /** Whether a mark-read request is in flight (disable the primary CTA). */
  isSubmitting: boolean
  /** Primary CTA — mark read + advance (only for popups without a link CTA). */
  handleMarkRead: () => void
  /** Link CTA — open the link, mark read, advance. */
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

  const [current, setCurrent] = useState<PopupItem | null>(null)
  // Marked read / actioned this session — hidden until the refetch drops them.
  const handledRef = useRef(new Set<string>())
  // "Show me later" — hidden until the page reloads (not marked read).
  const dismissedRef = useRef(new Set<string>())

  // Pick the next unhandled popup whenever we're idle.
  useEffect(() => {
    if (current) return
    const next = popups.find(
      (p) => !handledRef.current.has(popupKey(p)) && !dismissedRef.current.has(popupKey(p)),
    )
    setCurrent(next ?? null)
  }, [popups, current])

  const markReadMutation = useMutation({
    mutationFn: (item: PopupItem) =>
      item.source === 'a' ? markAnnouncementRead(Number(item.id)) : markMessageRead(Number(item.id)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['announcement'] }),
  })

  const completeAsRead = useCallback(
    (item: PopupItem) => {
      handledRef.current.add(popupKey(item))
      setCurrent(null) // effect advances to the next popup
      markReadMutation.mutate(item)
    },
    [markReadMutation],
  )

  const handleMarkRead = useCallback(() => {
    if (!current || hasCta(current)) return
    completeAsRead(current)
  }, [current, completeAsRead])

  const handleCta = useCallback(() => {
    const link = current?.ctaLink?.trim()
    if (!current || !link) return
    window.open(link, '_blank', 'noopener,noreferrer')
    completeAsRead(current)
  }, [current, completeAsRead])

  const handleShowLater = useCallback(() => {
    if (!current) return
    dismissedRef.current.add(popupKey(current))
    setCurrent(null) // effect advances (skipping the dismissed one)
  }, [current])

  return {
    current,
    isSubmitting: markReadMutation.isPending,
    handleMarkRead,
    handleCta,
    handleShowLater,
  }
}
