'use client'

import { useCallback, useEffect, useState } from 'react'

import type { LectureChatMessage } from '../constants/mockLectureChatMessages'

const AI_TUTOR_UNAVAILABLE_MESSAGE =
  'AI tutor is not connected for this lecture yet. Chat history will appear here once it is enabled.'

type UseLectureAiChatOptions = {
  defaultExpanded?: boolean
}

export function useLectureAiChat({
  defaultExpanded = false,
}: UseLectureAiChatOptions = {}) {
  const [isExpanded, setIsExpanded] = useState(() => defaultExpanded)
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<Array<LectureChatMessage>>([])
  const [isSending, setIsSending] = useState(false)

  const open = useCallback(() => setIsExpanded(true), [])
  const close = useCallback(() => setIsExpanded(false), [])

  const sendMessage = useCallback(() => {
    const text = inputValue.trim()
    if (!text || isSending) return

    const userMessage: LectureChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAtLabel: 'Just now',
    }

    setMessages(current => [...current, userMessage])
    setInputValue('')
    setIsSending(true)

    window.setTimeout(() => {
      setMessages(current => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: AI_TUTOR_UNAVAILABLE_MESSAGE,
          createdAtLabel: 'Just now',
        },
      ])
      setIsSending(false)
    }, 400)
  }, [inputValue, isSending])

  useEffect(() => {
    if (!isExpanded) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isExpanded, close])

  return {
    isExpanded,
    isSending,
    inputValue,
    messages,
    open,
    close,
    setInputValue,
    sendMessage,
  }
}
