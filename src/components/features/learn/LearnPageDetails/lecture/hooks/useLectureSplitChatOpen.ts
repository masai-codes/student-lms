'use client'

import { useCallback, useEffect, useState } from 'react'

import { LECTURE_RAIL_MEDIA_QUERY } from '../constants/lectureSplitLayout'

export function useLectureSplitChatOpen() {
  // Start closed (SSR-safe). On mount we always auto-open on the laptop/desktop
  // rail — the open state is intentionally NOT persisted across reloads. We want
  // every page load to surface the AI chat (even if the user closed it in a
  // previous visit) so returning users are reminded it exists. On mobile/tablet
  // the chat is a bottom drawer that must never auto-open on load.
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const isRailViewport = window.matchMedia(LECTURE_RAIL_MEDIA_QUERY).matches
    setIsOpen(isRailViewport)
  }, [])

  const open = useCallback(() => {
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  return { isOpen, open, close }
}
