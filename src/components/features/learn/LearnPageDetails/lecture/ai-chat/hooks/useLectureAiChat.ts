'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  MOCK_ASSISTANT_REPLY,
  MOCK_LECTURE_CHAT_HISTORY,
  type LectureChatMessage,
} from '../constants/mockLectureChatMessages'

type UseLectureAiChatOptions = {
  defaultExpanded?: boolean
}

export function useLectureAiChat({
  defaultExpanded = false,
}: UseLectureAiChatOptions = {}) {
  const [isExpanded, setIsExpanded] = useState(() => defaultExpanded)
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState(MOCK_LECTURE_CHAT_HISTORY)
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
          content: MOCK_ASSISTANT_REPLY,
          createdAtLabel: 'Just now',
        },
      ])
      setIsSending(false)
    }, 700)
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
