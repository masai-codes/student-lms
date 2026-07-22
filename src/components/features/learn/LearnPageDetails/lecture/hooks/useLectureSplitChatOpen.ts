'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  LECTURE_RAIL_MEDIA_QUERY,
  LECTURE_SPLIT_CHAT_OPEN_BY_DEFAULT,
  LECTURE_SPLIT_CHAT_STORAGE_KEY,
} from '../constants/lectureSplitLayout'

function readStoredOpenPreference(): boolean {
  if (typeof window === 'undefined') {
    return LECTURE_SPLIT_CHAT_OPEN_BY_DEFAULT
  }

  try {
    const stored = window.localStorage.getItem(LECTURE_SPLIT_CHAT_STORAGE_KEY)
    if (stored === 'true') return true
    if (stored === 'false') return false
  } catch {
    // Ignore storage failures (private mode, quota, etc.).
  }

  return LECTURE_SPLIT_CHAT_OPEN_BY_DEFAULT
}

function persistOpenPreference(isOpen: boolean): void {
  try {
    window.localStorage.setItem(LECTURE_SPLIT_CHAT_STORAGE_KEY, String(isOpen))
  } catch {
    // Ignore storage failures.
  }
}

export function useLectureSplitChatOpen() {
  // Start closed (SSR-safe). The persisted "open by default" is a laptop/desktop
  // rail concept only — on mobile/tablet the chat is a bottom drawer that must
  // never auto-open on load.
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const isRailViewport = window.matchMedia(LECTURE_RAIL_MEDIA_QUERY).matches
    setIsOpen(isRailViewport ? readStoredOpenPreference() : false)
  }, [])

  const open = useCallback(() => {
    setIsOpen(true)
    persistOpenPreference(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    persistOpenPreference(false)
  }, [])

  return { isOpen, open, close }
}
