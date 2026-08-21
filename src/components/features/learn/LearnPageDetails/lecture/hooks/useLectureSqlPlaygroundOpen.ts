'use client'

import { useCallback, useState } from 'react'

/**
 * Open/close state for the SQL Playground drawer. Unlike the AI chat
 * (`useLectureSplitChatOpen`), this never auto-opens — it's opened only by an
 * explicit action (the toolbar's "SQL" pill, or the in-lecture nudge card).
 */
export function useLectureSqlPlaygroundOpen() {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedEntryId, setHighlightedEntryId] = useState<number | null>(
    null,
  )

  const open = useCallback((entryId?: number) => {
    setHighlightedEntryId(entryId ?? null)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  return { isOpen, highlightedEntryId, open, close }
}
